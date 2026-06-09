# 005 — Expert prompts for runtime agents

## Context

- Project: CODEXRS / Maestro at `/Users/bradleydave/Dev/maestro-github`.
- This is an internal HORECA agency operating system, not a public SaaS.
- Goal: make runtime agents behave more like senior specialists while keeping the MVP simple, testable, and cost-aware.
- The current agent chain is described in `lib/agent-registry.ts`.
- Existing runtime agent implementations live in `lib/agents/`.

Read these files first:

- `lib/agent-registry.ts`
- `lib/agents/account-director.ts`
- `lib/agents/planner.ts`
- `lib/agents/social-expert.ts`
- `lib/agents/image-generator.ts`
- `lib/agents/visual-identity.ts`
- `lib/agents/vision-analyzer.ts`
- `lib/agents/supervisor.ts`
- `lib/agents/meta-publisher.ts`
- `lib/agents/performance-analyst.ts`
- `lib/agents/profit-controller.ts`
- `types/client.ts`
- `types/post.ts`
- `types/asset.ts`
- `types/finance.ts`

## Goal

Create a maintainable prompt architecture that enriches each runtime agent with:

1. Senior persona and operating principles.
2. HORECA-specific expertise.
3. Anti-error rules and hallucination prevention.
4. Structured input/output contracts.
5. Lightweight feedback rubric.

This should centralize expertise without rewriting the entire pipeline.

## Required implementation

### 1. Create a central prompt module

Create:

- `lib/agents/prompts/index.ts`

It should export:

- an `AgentExpertiseProfile` type;
- an `AGENT_EXPERTISE_PROFILES` record keyed by agent id;
- helper functions:
  - `getAgentExpertiseProfile(agentId: string)`;
  - `buildExpertSystemPrompt(agentId: string, existingPrompt?: string)`.

Keep it plain TypeScript. No new dependencies.

### 2. Cover these agents

At minimum include profiles for:

- `account-director`
- `strategy-director`
- `social-expert`
- `visual-director`
- `da-curator`
- `vision-analyzer`
- `supervisor`
- `publisher`
- `performance-analyst`
- `profit-controller`
- `video-creator`

Each profile should include:

- `name`
- `seniorPersona`
- `domainKnowledge`
- `operatingPrinciples`
- `commonFailureModes`
- `inputRequirements`
- `outputContract`
- `feedbackLoop`

Write copy in French because CODEXRS UI and agent outputs are French.

### 3. Use the prompt module in Claude-backed agents

Integrate `buildExpertSystemPrompt` into the existing system prompts for Claude-backed agents where it is low-risk:

- `lib/agents/account-director.ts`
- `lib/agents/social-expert.ts`
- `lib/agents/supervisor.ts`

Optional if obvious and low-risk:

- `lib/agents/planner.ts`
- `lib/agents/visual-identity.ts`
- `lib/agents/vision-analyzer.ts`
- `lib/agents/performance-analyst.ts`

Do not change business behavior beyond stronger instructions.
Do not change database schema.
Do not change API routes unless required by TypeScript.

### 4. Keep JSON strict

All updated prompts must continue to demand strict JSON when the existing agent expects JSON.

Avoid telling the model to reveal hidden reasoning. Instead, ask it to perform an internal expert review and return only a short `reasoning`, `rationale`, `summary`, or `risks` field when the existing schema already supports it.

### 5. Documentation

Create:

- `docs/ops/AGENT_EXPERTISE.md`

It should explain:

- the difference between Codex skills and runtime agents;
- where expert prompts live;
- how to add a new agent profile;
- how to keep prompts short enough to avoid token waste;
- how feedback should later be connected to performance data.

## Constraints

- Keep changes surgical.
- Do not introduce a complex prompt framework.
- No new npm packages.
- No secret values.
- Do not remove existing fallback behavior.
- Maintain current public function signatures unless a change is clearly necessary.

## Validation

Run:

```bash
npm run build
npx eslint lib/agents/prompts/index.ts lib/agents/account-director.ts lib/agents/social-expert.ts lib/agents/supervisor.ts
```

If the project has no dedicated typecheck script, `npm run build` is enough.

## Expected output

Return:

- files changed;
- agents covered;
- where prompts now live;
- validation results;
- any tradeoff or skipped integration.
