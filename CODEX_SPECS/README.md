# CODEX_SPECS

Specs that Claude Opus 4.7 (architect/manager) sends to Codex (executor) for implementation.

## Workflow

```
Claude writes spec → ./CODEX_SPECS/NNN-feature.md → codex exec executes → git diff review
```

## Invocation pattern

```sh
codex exec \
  --cd /Users/bradleydave/Dev/ai-command-center \
  --sandbox workspace-write \
  --output-last-message /tmp/codex-last.md \
  "$(cat CODEX_SPECS/NNN-feature.md)"
```

## Spec format

Each spec is a numbered markdown file (`001-`, `002-`, …) with:

1. **Context** — what's the project, where files live, conventions
2. **Goal** — one-line outcome
3. **Files to modify** — exact paths
4. **Changes** — precise additions/removals/renames
5. **Don't touch** — what must remain untouched
6. **Validation** — how Codex should verify the change (run `npm run lint`, `npx tsc --noEmit`, etc.)

## Why this split

| Task                                  | Agent     |
|---------------------------------------|-----------|
| Architecture decisions                | Claude    |
| Cross-file consistency                | Claude    |
| Strategic trade-offs                  | Claude    |
| Verbose code generation               | Codex     |
| Repetitive refactors                  | Codex     |
| Single-file scaffolds                 | Codex     |
| Final review of Codex output          | Claude    |
