# CODEXRS Connections

This file documents the external services required by CODEXRS.

Never commit real secrets. Local secrets belong in `.env.local`. Production secrets belong in Vercel Environment Variables.

## Local Environment

Required or useful variables:

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
META_APP_ID=
META_APP_SECRET=
DATABASE_URL=file:./codexrs.db
DATABASE_AUTH_TOKEN=
BLOB_READ_WRITE_TOKEN=
CODEXRS_PUBLIC_URL=http://localhost:3010
NEXT_PUBLIC_APP_URL=http://localhost:3010
CODEXRS_PASSWORD=
CRON_SECRET=
LUMA_API_KEY=
OLLAMA_HOST=
CODEXRS_AUTO_INIT_SCHEMA=
```

## Anthropic

Purpose:

- Claude supervision;
- client strategy;
- social copy generation;
- DA and vision analysis.

Variable:

- `ANTHROPIC_API_KEY`

## OpenAI

Purpose:

- image generation;
- ChatGPT-compatible helper routes;
- future multimodal workflows.

Variables:

- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`

## Meta Facebook / Instagram

Guide détaillé : [META_SETUP.md](./META_SETUP.md)

Purpose:

- page discovery;
- Facebook publishing;
- Instagram publishing;
- token diagnostics.

Global app variables:

- `META_APP_ID`
- `META_APP_SECRET`

Per-client data:

- Page Access Token;
- Facebook Page ID;
- Instagram Business Account ID.

These per-client values are saved through `/clients/[id]/connections`, not normally through `.env.local`.

Minimum practical Meta permissions:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

Setup summary:

- `META_APP_ID` and `META_APP_SECRET` are global app credentials.
- A User Access Token is pasted only to discover Pages.
- The app stores the per-client Page Access Token returned by Meta.
- Instagram must be professional and linked to the selected Facebook Page.
- Production Instagram images must use public HTTPS URLs.

## GitHub

Current remote:

```text
https://github.com/KnoopGod/maestro.git
```

Recommended branches:

- `main`: production/stable.
- `codex/mvp-hardening`: Codex implementation.
- `claude/*`: Claude reviews/specs/experiments.

## Vercel

Purpose:

- production deployment;
- preview deployments;
- cron execution;
- environment variable management;
- optional Vercel Blob.

Required production variables:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`
- `CODEXRS_PUBLIC_URL`
- `CRON_SECRET`
- `BLOB_READ_WRITE_TOKEN` if using Vercel Blob

Cron:

```json
{
  "path": "/api/cron/publish-due",
  "schedule": "0 8 * * *"
}
```

## Turso

Purpose:

- persistent LibSQL database in production.

Variables:

- `DATABASE_URL=libsql://...`
- `DATABASE_AUTH_TOKEN=...`

Local fallback:

- `DATABASE_URL=file:./codexrs.db`

Do not use the local file fallback for real production client data.

Schema init:

- local/dev and local file DBs auto-initialize the schema;
- production Turso skips automatic schema initialization by default to avoid slow Vercel cold starts;
- set `CODEXRS_AUTO_INIT_SCHEMA=true` only temporarily if a production migration must be forced from the app runtime.

## Vercel Blob

Purpose:

- public URLs for uploaded client images/videos/docs;
- Meta-compatible image URLs in production.

Variable:

- `BLOB_READ_WRITE_TOKEN`

## Luma

Purpose:

- image-to-video and later reel generation.

Variable:

- `LUMA_API_KEY`

## Ollama

Purpose:

- local/free draft helper for non-critical tasks.

Variable:

- `OLLAMA_HOST`

Ollama is not required for the core MVP.
