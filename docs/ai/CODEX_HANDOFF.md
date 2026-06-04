# Codex Handoff

## Current Branch

`codex/mvp-hardening`

## Current Local URL

`http://localhost:3010`

## Current State

- Product has been renamed to CODEXRS in the codebase.
- Main workflow pages exist: Clients, Studio, Agents, Library, Validation, Calendar, Connections, Usage.
- Database schema initializes lazily before query execution in the Codex branch.
- API connection cockpit exists at `/connections`.
- Local dev server uses port `3010`.

## Checks To Run After Changes

```bash
npx tsc --noEmit
npm run build
```

## External Setup Still Needed For Real Production

- Vercel project linked to the intended GitHub branch.
- Turso or persistent LibSQL database.
- Vercel Blob for uploaded assets in production.
- Meta app with required page permissions.
- Per-client Page Access Tokens stored through `/clients/[id]/connections`.
- `CODEXRS_PUBLIC_URL` set to the deployed HTTPS URL.

## Latest Implementation Notes

Use this file for short implementation summaries after important Codex work.

### 2026-05-30 - AI coordination and ops setup

- Added shared AI protocol files in `docs/ai/`.
- Added connection documentation in `docs/ops/CONNECTIONS.md`.
- Added current ops status in `docs/ops/STATUS.md`.
- Updated `CLAUDE.md` so Claude defaults to product/UX/marketing specs before implementation.
- Created local `.env.local` from existing local env files without printing secrets.
- Linked this folder to Vercel project `knoop-god-s-projects/maestro`.
- Added `CODEXRS_PUBLIC_URL` and `CODEXRS_PASSWORD` to Vercel Production.
