# CODEXRS AI Collaboration Workflow

Use this workflow when Bradley wants Claude and Codex to work on the same product without creating conflicting implementations.

## Default Flow

1. Bradley describes the desired product change.
2. Claude turns it into a short product/marketing/UX spec.
3. Codex reads the spec, checks the repo, and implements the smallest safe change.
4. Codex verifies with `npx tsc --noEmit` and `npm run build`.
5. Claude reviews the result from a product and marketing angle.
6. Codex applies only the review items that improve the MVP workflow.
7. Bradley validates before production or automatic publishing changes.

## Branch Rules

Recommended branch roles:

- `main`: stable production branch.
- `codex/mvp-hardening`: Codex implementation branch.
- `claude/*`: Claude experiments, specs, or product reviews.
- `integration/*`: optional branch used only when merging parallel work.

Do not let two agents edit the same files on different branches without a clear merge plan.

## Handoff Format From Claude To Codex

Claude should write:

```text
Objective:

Workflow:

Agents involved:

Data model impact:

UI impact:

API impact:

Validation rules:

MVP scope:

Out of scope:

Acceptance checks:
```

## Handoff Format From Codex To Claude

Codex should write:

```text
Implemented:

Files changed:

Behavior changed:

Checks run:

Known gaps:

Review questions for Claude:
```

## Definition Of Done

A change is done when:

- it supports the client -> strategy -> Library -> Studio -> validation -> calendar/publication flow;
- it does not break existing routes;
- TypeScript passes;
- production build passes;
- secrets are not committed;
- external APIs fail with clear user-facing instructions.
