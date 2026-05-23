# 003 — Account Director Agent + Pipeline orchestrator

## Context

- Project: **Maestro** (Next.js 16 + LibSQL + TypeScript) at `/Users/bradleydave/Dev/ai-command-center`
- After specs #001 (ClientStrategy) and #002 (Supervisor), the registry in `lib/agent-registry.ts` lists 8 active agents but **Account Director** has no implementation yet — only a description.
- Account Director's job: BEFORE the user writes a brief, read the client's strategy, recent posts and DA, then **propose a priority + an enriched brief**. This stops the user from picking a redundant angle and feeds Social Expert + Visual Director with richer context.
- This spec also adds a **pipeline orchestrator** (`runPostPipeline`) so that everything from Account Director → Social Expert → Visual Director → Supervisor runs in a single function call. The pipeline runs at generation time so the user sees a fully-supervised, ready-to-validate post.

**Files to read first** (read them before writing anything):
- `lib/agent-registry.ts` — Account Director entry, see I/O contract
- `lib/agents/planner.ts` — most recent pattern: Opus 4.7 + adaptive thinking + fallback + cost tracking
- `lib/agents/supervisor.ts` — same pattern + JSON parsing robustness
- `lib/agents/social-expert.ts` — caption generator (will be called by the orchestrator)
- `lib/agents/image-generator.ts` — image generator (will be called by the orchestrator)
- `lib/db/queries/posts.ts` — Post shape, listPosts helper
- `lib/db/queries/clients.ts` — Client shape
- `lib/db/queries/assets.ts` — getVisualIdentity helper
- `app/api/studio/generate-post/route.ts` — current generation flow (will be rewritten to use the orchestrator)
- `types/post.ts` — Post + SupervisorReview types
- `types/client.ts` — Client + ClientStrategy types
- `components/studio/PostIdeasPanel.tsx` — Studio panel that already calls the planner
- `/Users/bradleydave/Dev/maestro/lib/agents.ts` — reference for prompt/JSON style (do NOT copy verbatim, adapt to our conventions: Opus 4.7 + adaptive thinking + cost tracking with `(input * 5 + output * 25) / 1_000_000`)

## Goal

### 1. New agent `lib/agents/account-director.ts`

```ts
import type { Client } from '@/types/client'
import type { Post } from '@/types/post'

export interface AccountDirective {
  /** The priority pillar to address next (from client.strategy.contentPillars). */
  priorityPillar: string
  /** A 1-sentence rationale explaining why this pillar now. */
  rationale: string
  /** Enriched brief: 2-4 sentences ready to feed Social Expert. */
  enrichedBrief: string
  /** Hook idea (1 short sentence). */
  hookSuggestion: string
  /** Suggested CTA verb (e.g. "Réservez", "Découvrez"). */
  ctaSuggestion: string
  /** Pillars already covered by recent posts — to avoid repeating. */
  recentPillarsCovered: string[]
}

export async function runAccountDirector(input: {
  client: Client
  /** Optional user-supplied brief — Account Director enriches it instead of replacing. */
  userBrief?: string
  /** Optional list of recent posts for repetition detection. If omitted, the agent loads the last 10 itself. */
  recentPosts?: Post[]
}): Promise<{
  directive: AccountDirective
  cost: number
  tokensUsed: number
  model: string
}>
```

- System prompt: French, persona "Account Director Maestro, chef de dossier client", strict JSON output.
- User prompt must include: client (name, type, city, description, brand voice tone/keywords/avoid), strategy (objective, contentPillars, frequency, avoid), DA summary if available, and a list of recent posts (brief + pillar guess) for repetition awareness.
- If `recentPosts` is not provided, call `listPosts({ clientId: client.id, limit: 10 })`.
- If `userBrief` is provided, the agent enriches it rather than replacing. If absent, the agent proposes a fresh brief on the priority pillar.
- Use Opus 4.7 + `thinking: { type: 'adaptive' }` + `output_config: { effort: 'high' }`.
- Robust JSON extraction (strip ```` ``` ```` fences, then regex match `{[\s\S]*}`).
- Cost: `(input * 5 + output * 25) / 1_000_000`, rounded to 6 decimals.
- Fallback (no `ANTHROPIC_API_KEY` OR Anthropic error): return a heuristic directive (first uncovered pillar, generic enrichedBrief = userBrief || `${client.strategy.contentPillars[0]} — ${client.name}`, sensible CTA based on `client.type`). Always return `model: 'fallback'`.

### 2. Pipeline orchestrator `lib/agents/pipeline.ts`

A single function that runs Account Director → Social Expert → Image Generator → Supervisor in order, returns a complete post.

```ts
import type { Client } from '@/types/client'
import type { Post, PostPlatform, PostContentType, SupervisorReview } from '@/types/post'
import type { AccountDirective } from '@/lib/agents/account-director'

export interface PipelineResult {
  post: Post                            // persisted in DB
  directive: AccountDirective
  review: SupervisorReview | null       // null if supervisor failed
  totalCost: number
  totalTokens: number
  models: string[]                      // list of model strings used
}

export async function runPostPipeline(input: {
  client: Client
  userBrief?: string
  platforms: PostPlatform[]
  contentType?: PostContentType
  /** If true, skip image generation (text-only). Default false. */
  skipImage?: boolean
}): Promise<PipelineResult>
```

Behavior:
1. Call `runAccountDirector({ client, userBrief })` — get directive.
2. Build the effective brief = `directive.enrichedBrief`.
3. Call `generateCaption({ client, brief: effectiveBrief, platforms, contentType })` (from `lib/agents/social-expert.ts`).
4. If `!skipImage`, call `generateAndStoreImage({ client, brief: effectiveBrief, caption: primaryCaption.caption, visualIdentity: identity })` (from `lib/agents/image-generator.ts`); load `getVisualIdentity(client.id)` first.
5. Compute `impactScore` using the existing heuristic in `app/api/studio/generate-post/route.ts` (extract it as `lib/agents/impact-scorer.ts` or inline — your call, but factor it out so it's reusable; mention the move in your output).
6. Insert via `createPost({...})`.
7. Call `supervisePost({ client, post })`. Persist via `setSupervisorReview(post.id, review)`. If verdict === 'ready', call `setPostStatus(post.id, 'ready')`. If supervisor throws, log to stderr and continue with `review: null`.
8. Sum cost + tokens from all 4 stages (Account Director + Social Expert + Image + Supervisor). Return the assembled `PipelineResult`. The returned `post` must reflect the final status (load it again with `getPost` after the supervisor step).

### 3. Rewire `app/api/studio/generate-post/route.ts`

Replace the existing logic with a call to `runPostPipeline`. The response shape must remain backwards-compatible with what `components/studio/StudioForm.tsx` reads today:

```ts
return NextResponse.json({
  post: result.post,
  captions: text.captions,            // still need to expose the multi-platform caption list
  reasoning: text.reasoning,
  review: result.review,
  cost: result.totalCost,
  tokensUsed: result.totalTokens,
  model: result.models[result.models.length - 1] ?? 'fallback',
  directive: result.directive,        // NEW — Studio will display it
})
```

To keep `captions` and `reasoning` available, `runPostPipeline` must also surface them. Adjust `PipelineResult` to include:

```ts
captions: GeneratedCaption[]           // from social-expert
reasoning: string                      // from social-expert
```

(re-export `GeneratedCaption` from `social-expert.ts` if it isn't already exported).

### 4. Show the directive in Studio

In `components/studio/StudioForm.tsx`:

- `GenerationResult` interface: add optional `directive?: AccountDirective`.
- After the existing "💡 Stratégie" block, insert a new panel:
  ```
  🎯 Account Director — Pilier prioritaire : {directive.priorityPillar}
  Rationale : {directive.rationale}
  Hook proposé : "{directive.hookSuggestion}"
  CTA proposé : {directive.ctaSuggestion}
  Piliers récemment couverts : chips
  ```
- Style: bg-amber-950/20 + border-amber-700/30, icon Target from lucide-react.

## Don't touch

- `lib/agents/supervisor.ts` — call it, don't modify it.
- `lib/agents/planner.ts` — already wired into Studio via PostIdeasPanel.
- The DB schema (no new columns; use existing `posts` table).
- `app/api/studio/publish-post/route.ts` — uses `lib/agents/publish-pipeline.ts`, unchanged.
- `app/api/cron/publish-due/route.ts` — uses the publish pipeline, unchanged.

## Conventions to respect

- French for UI labels, prompts, comments, and error messages.
- English for code identifiers.
- Opus 4.7 + adaptive thinking + effort high for qualitative tasks.
- Pricing: `(in * 5 + out * 25) / 1_000_000`.
- Robust JSON extraction (markdown-fence stripping + regex fallback).
- No new external deps.
- Match the existing agent style: each agent is a pure function module, never touches the DB except through `lib/db/queries/*`.

## Validation steps Codex must run

1. `npx tsc --noEmit` — zero errors.
2. `grep -rn "runAccountDirector\|runPostPipeline\|AccountDirective" lib/ app/ components/` — should show usage in at least: agent file, pipeline file, generate-post route, StudioForm.
3. Confirm `app/api/studio/generate-post/route.ts` is now ~20 lines (just request parsing + `runPostPipeline` call + response shaping).
4. Curl smoke-test: `curl -X POST http://localhost:3011/api/studio/generate-post -H 'content-type: application/json' -d '{"clientId":"shMsDzqUA1xC","brief":"Test","platforms":["facebook"]}'` should return JSON with `directive` and `review` keys (it may fail at image generation step if OPENAI key missing — that's fine, just confirm the response shape).

## Output expected

Short summary covering:
- Files created (account-director.ts, pipeline.ts, possibly impact-scorer.ts).
- Files modified (generate-post route, StudioForm).
- TypeScript errors — should be zero.
- Confirmation that StudioForm renders the directive panel.
- Total LOC added.
