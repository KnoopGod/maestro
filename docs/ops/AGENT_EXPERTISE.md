# Agent Expertise Prompts

## Codex skills vs runtime agents

Codex skills are local development instructions for the coding assistant. They help modify this repository and are not executed inside Maestro.

Runtime agents are product agents used by Maestro/CODEXRS during the client workflow: account direction, planning, captions, DA synthesis, supervision, publishing, performance and margin control. Their behavior is defined in `lib/agents/` and surfaced in `lib/agent-registry.ts`.

This document covers runtime agent prompts only.

## Where prompts live

Shared expertise profiles live in:

```txt
lib/agents/prompts/index.ts
```

Each profile is keyed by the agent id from `lib/agent-registry.ts`. The module exports:

- `AgentExpertiseProfile`
- `AGENT_EXPERTISE_PROFILES`
- `getAgentExpertiseProfile(agentId)`
- `buildExpertSystemPrompt(agentId, existingPrompt?)`

Claude-backed agents keep their local task prompt, then call `buildExpertSystemPrompt` to append shared senior expertise, HORECA knowledge, anti-error rules, input expectations, output contract and a lightweight self-review rubric.

## Adding a new profile

1. Add or confirm the agent id in `lib/agent-registry.ts`.
2. Add the same id to `AGENT_EXPERTISE_PROFILES`.
3. Keep every field short and operational:
   - `seniorPersona`: one sentence.
   - `domainKnowledge`: 2-4 bullets.
   - `operatingPrinciples`: 3-5 bullets.
   - `commonFailureModes`: concrete mistakes to avoid.
   - `inputRequirements`: data the agent should rely on.
   - `outputContract`: schema and formatting rules.
   - `feedbackLoop`: quick internal checks before returning.
4. If the implementation has a system prompt, wrap it:

```ts
const systemPrompt = buildExpertSystemPrompt('agent-id', `Existing prompt...`)
```

Do not change parser logic, database schema, API routes or public function signatures just to add expertise.

## Keeping prompts cost-aware

These prompts are runtime token cost, so treat them like product code:

- Prefer specific bullets over long essays.
- Avoid repeated generic advice across agents unless it prevents a real failure.
- Keep schema instructions close to the caller prompt when the agent parses JSON.
- Do not ask the model to reveal hidden reasoning.
- Use short fields already supported by the schema, such as `reasoning`, `summary`, `rationale` or `risks`.
- Review token impact before adding long domain playbooks.

If a prompt needs more detail, first ask whether that detail belongs in structured client data, strategy, DA, or post history instead of in the global system prompt.

## Feedback and performance data

The current `feedbackLoop` field is prompt guidance only. Later it should connect to observed runtime data:

- Supervisor verdicts and recurring risks can tune Social Expert and Visual Director instructions.
- Meta insights can tune Strategy Director and Performance Analyst recommendations.
- Profit Controller reports can decide when expensive image or video generation is justified.
- Human validation edits can become examples or lightweight rules once patterns are repeated.

Keep that loop data-driven. Do not add large prompt rules for one-off preferences.
