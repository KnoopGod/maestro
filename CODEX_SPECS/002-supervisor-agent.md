# 002 — Supervisor Agent (quality gate before publication)

## Context

- Project: **Maestro** (Next.js 16 + LibSQL + TypeScript) at `/Users/bradleydave/Dev/ai-command-center`
- After Codex spec #001, clients now carry a typed `ClientStrategy`.
- We want to add a **quality gate** that reviews every generated post BEFORE allowing publication. Inspired by `supervisePost()` in the parallel Codex codebase at `/Users/bradleydave/Dev/maestro/lib/agents.ts` (lines 159-225 + fallback at 347-367).
- The supervisor uses Opus 4.7 + adaptive thinking (qualitative judgment matters).

**Files to read first**:
- `lib/agents/social-expert.ts` — for the prompt + JSON parse pattern to mirror
- `lib/agents/strategy-director.ts` — for the helper-style pattern
- `lib/db/queries/posts.ts` — to see the Post shape + status enum
- `app/api/studio/publish-post/route.ts` — where the supervisor will be wired in
- `/Users/bradleydave/Dev/maestro/lib/agents.ts` — reference implementation (DO NOT copy verbatim, adapt to our conventions)

## Goal

A new agent `lib/agents/supervisor.ts` that:
1. Takes a `Client` + a `Post` (or post draft) as input
2. Calls Claude Opus 4.7 with a critic-style prompt
3. Returns a structured `SupervisorReview` verdict
4. Has a graceful fallback when no `ANTHROPIC_API_KEY` is set (heuristic-based)

The supervisor is wired into `/api/studio/publish-post`:
- Before publishing to Meta, call `supervisePost({client, post})`
- If verdict is `'blocked'` → return 400 with the explanation, do NOT publish
- If verdict is `'revise'` → still allow publish (it's a warning) but include `warnings` in the response
- If verdict is `'ready'` → proceed as before

## Files to modify / create

1. **`types/post.ts`** (modify)
   Add interface and export it:
   ```ts
   export interface SupervisorReview {
     verdict: 'ready' | 'revise' | 'blocked'
     score: number       // 0-100
     summary: string     // 1-2 sentences in French
     risks: string[]     // 0-5 short bullets
     improvements: string[]  // 0-5 short bullets
     nextAction: string  // single actionable sentence
   }
   ```

2. **`lib/agents/supervisor.ts`** (NEW)
   Export function:
   ```ts
   export async function supervisePost(input: {
     client: Client
     post: Post
   }): Promise<{ review: SupervisorReview; cost: number; tokensUsed: number; model: string }>
   ```
   - System prompt: French, Claude Supervisor persona, role = critic + quality director for Maestro HORECA platform
   - User prompt: include client (name, type, city, positioning if available — fallback to `description` + brand voice + strategy.objective + strategy.avoid) + post (brief, platforms, caption, hashtags, hook, cta, imagePrompt, current impactScore)
   - Ask Claude to respond in JSON strict with the SupervisorReview shape
   - Use the SAME robust JSON extraction as `social-expert.ts` (strip code fences then regex match)
   - Use **Opus 4.7** + `thinking: { type: 'adaptive' }` + `output_config: { effort: 'high' }`
   - Pricing for cost: `(input * 5 + output * 25) / 1_000_000`
   - Return `{ review, cost, tokensUsed, model: 'claude-opus-4-7' }`
   - On `ANTHROPIC_API_KEY` missing OR Anthropic API error → call `fallbackSupervisorReview({client, post})` and return `{ review: <fallback>, cost: 0, tokensUsed: 0, model: 'fallback' }`

3. **`lib/agents/supervisor.ts`** also contains `fallbackSupervisorReview`:
   - Pure heuristic, no API call
   - Checks: `hasImage = Boolean(post.imageUrl)`, `hasCta = /réserv|contact|message|découvr|book|dm|appel|passez/i.test(post.caption)`, `captionLength` reasonable, `hashtagCount` between 3-12
   - Computes a score: base 70, +5 if image, +5 if CTA, +5 if hashtags in range, -10 if caption < 50 chars or > 1500
   - Verdict: `'ready'` if score >= 80 and hasImage and hasCta; else `'revise'`. Never `'blocked'` in fallback.
   - Risks/improvements derived from the same checks
   - `nextAction`: `'Ajouter ANTHROPIC_API_KEY pour obtenir une vraie supervision Claude.'`

4. **`app/api/studio/publish-post/route.ts`** (modify)
   - At the start of the try block (after loading the post and BEFORE checking `forceTextOnly`):
     ```ts
     // Quality gate
     const client = await getClient(post.clientId)
     if (!client) throw new Error('Client introuvable')
     const supervisorResult = await supervisePost({ client, post })
     if (supervisorResult.review.verdict === 'blocked') {
       await markPostFailed(post.id, `Supervisor blocked: ${supervisorResult.review.summary}`)
       return NextResponse.json({
         error: `Bloqué par le supervisor : ${supervisorResult.review.summary}`,
         review: supervisorResult.review,
       }, { status: 400 })
     }
     ```
   - Import `getClient` from `@/lib/db/queries/clients` and `supervisePost` from `@/lib/agents/supervisor`.
   - In the final success response (`return NextResponse.json({ post: updated, warnings... })`), also include `review: supervisorResult.review` so the UI can show the verdict + improvements.
   - If verdict is `'revise'`, add `supervisorResult.review.summary` to the warnings array.

5. **`components/studio/StudioForm.tsx`** (modify minimally)
   - In the `GenerationResult` interface, add optional `review?: SupervisorReview` field.
   - In the `handlePublish` async function, after parsing `data`, if `data.review` exists, store it in state (`setReview(data.review)`).
   - Add a new `<ReviewPanel>` JSX component AT THE END OF THE FILE in the same file (don't extract to a new file).
   - The panel shows:
     - Header with verdict pill ('ready' = emerald, 'revise' = amber, 'blocked' = red) and score
     - Summary in italic
     - Two columns: ⚠️ Risques (red-tinted chips) and 💡 Améliorations (purple-tinted chips)
     - Bottom: "Prochaine action" in a highlighted callout
   - Render the panel below the existing publish/error/success messages, when `review` is not null.

## Don't touch

- `lib/agents/strategy-director.ts` (just-added)
- The DB schema (no new column needed — supervisor results are computed on-the-fly each time)
- The Studio generation flow (`/api/studio/generate-post`) — supervisor only runs at publish time, not generation time
- Meta integration files (`lib/agents/meta-publisher.ts`, etc.)
- The publish-post error decoration logic (`decorateMetaError`)

## Conventions to respect

- French for UI labels, prompts, and error messages
- English for code identifiers
- Same JSON extraction robustness as `social-expert.ts`
- Opus 4.7 pricing: `(in * 5 + out * 25) / 1_000_000`
- No external deps added (use built-in `fetch` to Anthropic if you prefer, or the existing `@anthropic-ai/sdk` package — match what `social-expert.ts` uses, which is the SDK)

## Validation steps Codex must run

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — clean build with the new route still listed
3. Verify imports: `grep "supervisePost\|SupervisorReview" lib/ app/ -r` should show usage in 3-4 files only

## Output expected

Short summary:
- Files created / modified
- TypeScript errors / build warnings (should be none)
- Confirm the publish-post route now calls `supervisePost` and conditionally blocks
- Confirm the StudioForm displays the review panel after publishing
