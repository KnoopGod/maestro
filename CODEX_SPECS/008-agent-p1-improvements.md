# 008 — Agent P1 improvements

## Context

- Project: CODEXRS / Maestro at `/Users/bradleydave/Dev/maestro-github`.
- Spec 005 should have introduced centralized expert profiles in `lib/agents/prompts/index.ts`.
- This P1 spec improves operational reliability without changing the MVP flow.

Main flow to preserve:

```txt
client profile -> strategy -> resources/library -> generated post -> validation -> scheduling/publication -> performance/profit review
```

Read these files first:

- `lib/agent-registry.ts`
- `lib/agents/prompts/index.ts`
- `lib/agents/pipeline.ts`
- `lib/agents/publish-pipeline.ts`
- `lib/agents/tracking.ts`
- `lib/agents/profit-controller.ts`
- `lib/agents/performance-analyst.ts`
- `app/agents/page.tsx`
- `app/agents/jobs/[id]/page.tsx`
- `types/post.ts`
- `types/finance.ts`

## Goal

Add small, high-impact improvements so the agent system is easier to operate:

1. Agents have visible senior expertise metadata in the registry/UI.
2. Agent outputs can carry a standard quality/feedback envelope.
3. Profit Controller is represented as a real control gate, not just a page-level calculator.
4. Documentation explains the recommended chain of responsibility.

## Required implementation

### 1. Enrich agent registry from expertise profiles

Update `lib/agent-registry.ts` carefully so each `CODEXRSAgent` can optionally expose:

- `seniorPersona`
- `feedbackLoop`
- `failureModes`

Populate these fields from `AGENT_EXPERTISE_PROFILES` where possible, without duplicating large prompt text manually.

Keep the existing UI compatible. If any page renders unknown fields, no breakage.

### 2. Add an agent quality envelope type

Create or update a type in a sensible place, preferably:

- `lib/agents/prompts/index.ts`

Add:

```ts
export interface AgentQualityEnvelope<TPayload> {
  agentId: string
  confidence: number
  assumptions: string[]
  risks: string[]
  recommendations: string[]
  nextAgent?: string
  payload: TPayload
}
```

Do not force all existing agents to return this shape yet. Just export the type and document it as the future standard.

### 3. Add lightweight helpers

In `lib/agents/prompts/index.ts`, add a small helper:

- `createAgentQualityEnvelope<TPayload>(input: ...)`

It should:

- clamp confidence between 0 and 1;
- default arrays to `[]`;
- preserve payload;
- be easy to use later.

No runtime dependency.

### 4. Profit Controller P1

Improve the Profit Controller documentation/metadata:

- make clear it is a post-campaign/monthly control agent;
- list what data is currently estimated vs real;
- recommend when it should block or warn before expensive generation/video/ad spend.

Keep current calculations stable unless a tiny bug is obvious.

### 5. Documentation

Create or update:

- `docs/ops/AGENT_CHAIN.md`

It should explain:

- the runtime chain;
- responsibility of each agent;
- where expert profiles live;
- how the quality envelope should be adopted progressively;
- when Profit Controller should intervene;
- what should not be automated yet without human validation.

## Constraints

- Do not refactor the whole agent pipeline.
- No database schema change.
- No API behavior change unless required by type errors.
- No new dependencies.
- Keep edits small and reversible.

## Validation

Run:

```bash
npm run build
npx eslint lib/agent-registry.ts lib/agents/prompts/index.ts lib/agents/profit-controller.ts
```

If lint shows pre-existing unrelated errors globally, report them but verify the modified files directly.

## Expected output

Return:

- files changed;
- P1 improvements implemented;
- validation results;
- next recommended step.
