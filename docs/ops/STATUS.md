# CODEXRS Ops Status

Last checked: 2026-05-30.

## Local Project

- Path: `/Users/bradleydave/Dev/maestro-github`
- Branch: `codex/mvp-hardening`
- Local dev URL: `http://localhost:3010`
- Local env file: `.env.local` exists and is ignored by Git.

## GitHub

- Remote: `https://github.com/KnoopGod/maestro.git`
- Git push works through the configured Git remote.
- GitHub CLI is installed, but `gh auth status` reports an invalid token for `KnoopGod`.
- To fix GitHub CLI later: run `gh auth login -h github.com`.

## Vercel

- CLI installed: yes.
- Logged in as: `knoopgod`.
- Local folder linked to Vercel project: `knoop-god-s-projects/maestro`.
- Latest listed production URL: `https://maestro-green.vercel.app`.
- `CODEXRS_PUBLIC_URL` and `CODEXRS_PASSWORD` have been added to Production.
- Old variables `MAESTRO_PUBLIC_URL` and `MAESTRO_PASSWORD` still exist for backward compatibility and can be removed later after a stable deploy.

## Turso

- CLI installed: yes.
- Logged in as: `knoopgod`.
- Existing databases:
  - `maestro`
  - `turso-db-create-maestro`
- CODEXRS production should use a Turso `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.

## Local Environment Keys

Configured locally:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`
- `DATABASE_URL`
- `CODEXRS_PUBLIC_URL`
- `NEXT_PUBLIC_APP_URL`
- `CODEXRS_PASSWORD`
- `CRON_SECRET`
- `OLLAMA_HOST`

Missing or empty locally:

- `META_APP_ID`
- `META_APP_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `LUMA_API_KEY`
- `DATABASE_AUTH_TOKEN`

## Notes

- Meta Page Access Tokens are per-client values saved through `/clients/[id]/connections`.
- Do not commit `.env.local`, `.env.vercel.local`, or `.env.vercel.production.local`.
- Vercel environment variables are encrypted remotely; local pulled files are ignored by Git.
