# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Critical context

- **The folder is named `ai-command-center` for legacy reasons. The product is called CODEXRS** — a unified social media management platform for HORECA clients (restaurants, hotels, bars, B&Bs) powered by AI agents.
- **Next.js 16.2.6**. This version has breaking changes from your training data — read `node_modules/next/dist/docs/` (especially `01-app/01-getting-started/`) before writing routes, actions, or layouts. Heed deprecation notices.
- **Dev server runs on port 3010, not 3000** (`npm run dev` → http://localhost:3010).
- A few legacy pages still exist from the original "AI Command Center" iteration (`/dashboard`, `/models`, `/task-router`, `/token-economy`, `/work-memory`, `/resume-for-claude`, `/setup-guide`). They are no longer in the sidebar but the files are still in `app/`. Do not refactor them unless asked.
- **Claude should act primarily as product director, UX strategist, marketing strategist, and agent behavior reviewer.** Codex owns implementation on `codex/mvp-hardening` unless Bradley explicitly asks Claude to code.
- Before proposing significant work, read:
  - `docs/ai/ROLES.md`
  - `docs/ai/WORKFLOW.md`
  - `docs/ai/DECISIONS.md`
  - `docs/ops/CONNECTIONS.md`
  - `docs/ai/CODEX_HANDOFF.md`

## Claude collaboration contract

When Bradley asks for a new feature or improvement, default to a spec, not code.

Use this format:

1. Objective
2. User workflow
3. Agents involved
4. Data needed
5. Business rules
6. MVP priority
7. What Codex should code
8. What should not be coded yet

Do not create a second architecture, duplicate the data model, or rewrite broad UI/code areas without an explicit request. If implementation is requested, keep changes small, verifiable, and aligned with the client -> strategy -> Library -> Studio -> validation -> calendar/publication workflow.

## Common commands

```bash
npm run dev              # Dev server on :3010 (Turbopack)
npm run build            # Production build (use to verify changes compile)
npm run lint             # ESLint
npx tsc --noEmit         # Fast type check (preferred over build for quick checks)

# Database (LibSQL, file at ./codexrs.db)
npx tsx -e "import('./lib/db/schema').then(m => m.initSchema())"   # Init schema
npx tsx lib/db/seed.ts                                              # Seed HORECA mock clients

# MCP server (optional, separate from main app)
npm run mcp:build && npm run mcp:start
```

There is no test framework configured.

## Architecture

### The 4 layers of CODEXRS

```
UI (Next.js App Router)
    ↓ Server Actions / fetch
API routes (app/api/**/route.ts)
    ↓ call
Agents (lib/agents/*.ts)         ← AI orchestration + external APIs
    ↓ persist via
Data layer (lib/db/queries/*.ts)
    ↓
LibSQL (./codexrs.db, local SQLite — same client as Turso for cloud migration)
```

### Agents (`lib/agents/`)

Each agent is a single TypeScript module with one or two exported functions. They are pure functions: take context, hit an external API (Anthropic/OpenAI/Meta), return structured data. They never touch the DB directly — that's done by their caller (an API route or another agent).

- `social-expert.ts` — generates captions/hashtags per platform via Claude Sonnet 4.6. **Reads `client_visual_identity` and injects the DA into the prompt** when available.
- `vision-analyzer.ts` — analyzes an image with Claude Vision (palette, mood, tags, description).
- `visual-identity.ts` — synthesizes the **Direction Artistique (DA)** from analyzed assets. Produces a `style_prompt` that is automatically injected into all future generations for that client. This is the killer differentiator.
- `image-generator.ts` — calls OpenAI Images (gpt-image-1), stores the result via `lib/storage/local.ts`, creates a `client_assets` row.
- `meta-publisher.ts` — Meta Graph API wrapper. Token exchange, page discovery, Facebook + Instagram publishing, `debug_token`.

### Data model (`lib/db/schema.ts`)

Tables:
- `clients` — HORECA establishments (name, type, city, brand voice tone/keywords/avoid).
- `client_social_accounts` — Meta/IG/TikTok tokens, **stored in clear** (TODO: encrypt before prod).
- `client_assets` — uploaded photos/videos/docs + AI analysis (palette, mood, ai_description, extracted_text). One asset per uploaded file.
- `client_visual_identity` — one row per client, synthesized DA (style_prompt, palette, mood, etc.). Upserted, never duplicated.
- `posts` — generated posts. Status: `draft | published | failed`. `meta_post_ids` is a JSON map `{platform: postId}`.
- `client_agents` — agent assignments per client (placeholder; not actively used yet).

### Storage (`lib/storage/local.ts`)

Local filesystem under `public/uploads/clients/<clientId>/`. Files are served as static assets at `/uploads/clients/<clientId>/...`. The path is what gets stored in `client_assets.url`.

**Production gotcha**: Meta cannot fetch images from `localhost`. The publish flow in `app/api/studio/publish-post/route.ts` rewrites local URLs using `CODEXRS_PUBLIC_URL` env var. Without it, Facebook posts go through as text-only, Instagram posts are skipped with a warning.

### Server Actions

Located in `lib/actions/clients.ts`. They are imported into Server Components and passed to `<form action={...}>`. After mutating they call `revalidatePath()` and often `redirect()`.

### Studio → Publish flow (the critical path)

1. User opens `/studio`, picks a client, writes a brief, picks platforms.
2. POST `/api/studio/generate-post` → `generateCaption` + `generateAndStoreImage` → row inserted in `posts` with `status='draft'`.
3. User clicks "Publier" → POST `/api/studio/publish-post` with `{postId}`.
4. Route loads the post + the client's `client_social_accounts`, calls `publishToFacebook`/`publishToInstagram`.
5. On success → `markPostPublished` writes the `meta_post_ids`. On failure → `markPostFailed` writes the error string (visible in `/plan`).

If Meta returns an error, `decorateMetaError()` in the publish route rewrites it with the actionable fix (permissions, admin role, etc.) — don't strip those hints.

### Meta connection flow (per client)

`/clients/[id]/connections` hosts the wizard:

1. User pastes a User Access Token from Graph API Explorer.
2. POST `/api/meta/discover` → returns all FB Pages the user manages + their linked IG Business accounts.
3. User picks the page that represents this client.
4. POST `/api/meta/connect` → saves the **Page Access Token** (not the user token) in `client_social_accounts`.

The `/api/meta/debug-token` endpoint (called by the "Diagnostiquer" button) returns the actual permissions on the stored token by calling Meta's `/debug_token`. This is the first thing to check when publishing fails.

## Environment variables

```
ANTHROPIC_API_KEY=sk-ant-...    # Required (Claude Sonnet 4.6 + Vision)
OPENAI_API_KEY=sk-...           # Required for image generation
META_APP_ID=...                 # Optional (enables long-lived token exchange)
META_APP_SECRET=...             # Optional
CODEXRS_PUBLIC_URL=https://...  # Required in prod so Meta can fetch /uploads/*
DATABASE_URL=                   # Default: file:./codexrs.db (swap to Turso URL for cloud)
DATABASE_AUTH_TOKEN=            # Only if DATABASE_URL is a Turso URL
OLLAMA_HOST=                    # Legacy, unused by CODEXRS core
LUMA_API_KEY=                   # Optional, video generation
BLOB_READ_WRITE_TOKEN=          # Optional in dev, recommended in prod for public assets
CRON_SECRET=                    # Recommended in prod for scheduled publishing
CODEXRS_PASSWORD=               # Required if auth protection is enabled
NEXT_PUBLIC_APP_URL=            # Optional fallback URL
```

## Conventions

- French UI throughout (labels, error messages, comments often in French). Variable/function names stay in English.
- Server Components by default. Client Components only when interactivity is required (state, events). Mark with `'use client'`.
- DB queries return camelCase domain objects (see `mapRow` helpers); SQL columns are snake_case.
- Tailwind classes follow the dark theme: `bg-gray-950` background, `bg-gray-900/40` cards, `border-gray-800`, `purple-600` accent for primary, gradients for emphasis.
- Status colors are consistent: emerald (success), amber (warning/pause), red (error), purple (primary action).
- Icons from `lucide-react`. Note: `Facebook` and `Instagram` icons were removed from lucide — use inline SVG (see `MetaConnectionWizard.tsx`).

## Debugging the publishing flow

If "Publier sur Meta" fails:

1. Go to `/clients/[id]/connections` → click **"Diagnostiquer le token"**. The panel shows exact stored scopes vs required ones.
2. If `pages_manage_posts` is missing → the Meta app needs the **"Tout gérer sur votre Page"** use case added (at `developers.facebook.com/apps/<APP_ID>/use_cases/`). Generating a token without this use case enabled will silently strip the permission.
3. If the error is "(#200)" → user must be **Admin** of the page (not Editor/Moderator), AND the app must be in Development mode with the page linked to the same Business Manager.
4. If Instagram fails with image error → confirm `CODEXRS_PUBLIC_URL` is set and not `localhost`. The route auto-rejects localhost URLs.

## Things to know before refactoring

- Posts table is the source of truth for the entire pipeline (generation, scheduling, publishing, analytics). Do not split it without a real reason.
- The DA is what makes CODEXRS unique. Any change to `social-expert.ts` or `image-generator.ts` must continue to read and inject `getVisualIdentity()` results.
- All Anthropic responses are parsed as JSON with a robust fallback (regex extraction). Keep this pattern when adding new agents — Claude occasionally wraps JSON in markdown despite instructions.
- Cost tracking on posts is real (token-based). Vision/DA costs in `/usage` are estimates (`COST_ESTIMATES` in `lib/db/queries/usage.ts`). If you add per-call cost tracking for those, update the usage page to use real numbers.

## Claude ↔ Codex duo workflow

This project uses a two-agent architecture: **Claude** (architect) + **Codex** (executor).

```
Claude writes spec → CODEX_SPECS/NNN-feature.md → codex exec → Claude reviews diff
```

### Claude's responsibilities
- Architecture decisions, cross-file consistency, strategic trade-offs
- Writing detailed specs in `CODEX_SPECS/NNN-feature.md` (numbered, sequential)
- Reviewing Codex output (`git diff`) and fixing edge cases
- Never implementing features that belong to a Codex spec unless there's no Codex session available

### Codex's responsibilities
- Verbose code generation, repetitive scaffolds, single-file implementations
- Running `npx tsc --noEmit` + `npm run build` after every spec to validate
- Writing a summary of what was created/modified

### Spec format (CODEX_SPECS/NNN-feature.md)
Each spec must include: **Context** (files to read), **Goal** (one-line outcome), **Files to modify** (exact paths + precise changes), **Don't touch**, **Validation** (commands to run), **Output expected**.

### Invoking Codex (run from project root)
```sh
codex exec \
  --cd /Users/bradleydave/Dev/ai-command-center \
  --sandbox workspace-write \
  --output-last-message /tmp/codex-last.md \
  "$(cat CODEX_SPECS/NNN-feature.md)"
```

### When to write a new spec vs implement directly
- **Write a spec** when the task is >50 lines of code, touches >2 files, or is mostly scaffolding
- **Implement directly** for small fixes (<30 lines), urgent hotfixes, or when Codex is not available
- Existing specs: `CODEX_SPECS/` — always check before starting an implementation to avoid duplication
