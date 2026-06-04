# CODEXRS AI Roles

CODEXRS uses several AI layers. Keep them separate so Claude, Codex, and the runtime agents do not overwrite each other's responsibilities.

## Human Owner

Bradley is the final decision maker.

Bradley validates:

- client priorities;
- production publishing rules;
- real credentials and external accounts;
- final merge to production;
- whether an automation can run without manual validation.

## Claude Code

Claude acts as product director, marketing strategist, UX reviewer, and agent behavior designer.

Claude should mainly produce:

- product specs;
- workflow critique;
- marketing strategy;
- prompt architecture;
- agent role definitions;
- UX recommendations;
- quality criteria.

Claude should not directly rewrite the same implementation branch as Codex unless Bradley explicitly asks for that experiment.

Claude's default output format for implementation requests:

1. Objective
2. User workflow
3. Agents involved
4. Data needed
5. Business rules
6. MVP priority
7. What Codex should code
8. What should not be coded yet

## Codex

Codex acts as lead developer and integration owner.

Codex should mainly:

- read the codebase;
- implement scoped changes;
- maintain architecture consistency;
- update database/API/UI code;
- run `npx tsc --noEmit`;
- run `npm run build`;
- commit and push to GitHub when useful;
- report what changed and what still needs credentials.

Codex can challenge a spec if it creates technical risk, duplicates architecture, or goes beyond the MVP.

## Runtime Agents

Runtime agents are product features inside CODEXRS, not Codex/Claude skills.

Current operating chain:

```text
Account Director
-> Strategy Director
-> Social Director
-> Visual Director
-> Impact Reviewer
-> Publisher
-> Performance Analyst
```

Rules:

- Runtime agents work for a selected client.
- Outputs should be structured and stored when they affect the workflow.
- No runtime agent publishes automatically unless the validation rule permits it.
- Direction Artistique and client Library context must be reused before generating visual content.

## Shared Source Of Truth

GitHub is the source of truth for code and written decisions.

Use:

- `docs/ai/DECISIONS.md` for stable product/technical decisions;
- `docs/ai/CLAUDE_BRIEF.md` for Claude-facing requests;
- `docs/ai/CODEX_HANDOFF.md` for implementation status;
- `docs/ops/CONNECTIONS.md` for API and deployment setup.
