# 007 — Meta Setup Guide visible dans l'app

## Context

- Project: **CODEXRS / Maestro** (Next.js 16 + TypeScript + LibSQL) at `/Users/bradleydave/Dev/maestro-github`.
- This is an internal tool for managing HORECA clients, not a public SaaS.
- Facebook publishing already works through the existing Meta Graph API flow.
- Instagram connection support already exists through linked Instagram Business accounts.
- The user needs a clearer in-app guide to connect Meta correctly for each client, because every client will need its own Facebook Page / Instagram Business connection.

Read these files first:

- `app/connections/page.tsx`
- `app/clients/[id]/connections/page.tsx`
- `components/clients/MetaConnectionWizard.tsx`
- `components/clients/MetaPreflightChecklist.tsx`
- `lib/connection-registry.ts`
- `docs/ops/CONNECTIONS.md`
- `lib/agents/meta-publisher.ts`
- `app/api/meta/connect/route.ts`
- `app/api/meta/debug-token/route.ts`
- `app/api/meta/test-post/route.ts`

## Goal

Add a practical Meta setup guide that helps Bradley connect Facebook + Instagram for each client without guessing the steps.

The guide must clearly explain:

1. The required Meta prerequisites.
2. The exact permissions/scopes.
3. The difference between global Meta app credentials and per-client Page Access Tokens.
4. How to discover pages and linked Instagram accounts.
5. How to diagnose token problems.
6. How to test publishing safely.
7. What common Meta errors mean and what action to take.

## Files to modify

Prefer small changes in these files:

- `app/connections/page.tsx`
- `app/clients/[id]/connections/page.tsx`
- `components/clients/MetaConnectionWizard.tsx`
- `components/clients/MetaPreflightChecklist.tsx`
- `lib/connection-registry.ts`
- `docs/ops/CONNECTIONS.md`

Create this file if useful:

- `docs/ops/META_SETUP.md`

Do not create a new database table.
Do not store or print real tokens.
Do not change the existing publish pipeline unless a small copy/error-label improvement is clearly required.

## Product requirements

### 1. Global `/connections` page

Improve the global connections page so the Meta card tells the user:

- `META_APP_ID` and `META_APP_SECRET` are global app credentials.
- Page Access Tokens are per-client and must be added from `/clients/[id]/connections`.
- Instagram requires a professional Instagram account linked to the Facebook Page.
- Images must be public HTTPS URLs in production; localhost images cannot be published to Instagram.

Keep this page focused and scannable. Do not add a long wall of text.

### 2. Per-client `/clients/[id]/connections` page

Add a visible "Guide Meta pour ce client" section above or beside the wizard.

It should show a 5-step checklist:

1. Instagram professional account.
2. Instagram linked to the client's Facebook Page.
3. Meta app permissions enabled.
4. User token generated with the required permissions.
5. Token diagnosed and test post published.

Each step should include one short instruction and, when relevant, a link to the right external Meta page.

### 3. MetaConnectionWizard copy

Improve the copy but keep behavior intact:

- Make the difference between User Access Token and Page Access Token clearer.
- Explain that the wizard discovers pages from the User Access Token and then stores the Page Access Token returned by Meta.
- When Instagram is missing, explain the likely causes:
  - Instagram account is not professional.
  - Instagram is not linked to the selected Facebook Page.
  - token/app permissions do not include `instagram_basic`.

Do not remove the existing "Ajouter Instagram" sync flow.

### 4. Diagnostic help

If the token diagnostic reports missing permissions, show a short action block:

- regenerate the token in Graph API Explorer;
- include the missing scopes;
- reconnect the client;
- run diagnostic again.

If this is already present, improve clarity only.

### 5. Documentation

Update `docs/ops/CONNECTIONS.md`, or create `docs/ops/META_SETUP.md`, with:

- global variables required;
- per-client fields stored by the app;
- required permissions;
- setup steps;
- test flow;
- common errors:
  - `#190` token expired/invalid;
  - `#200` permissions/admin role problem;
  - `#100` invalid parameter / image URL inaccessible;
  - Instagram account not linked.

## UI constraints

- French UI copy.
- Keep the existing dark/HUD visual style.
- Avoid a landing-page style section.
- Use compact checklists, badges, and short helper text.
- No nested buttons.
- No new dependencies.

## Validation

Run:

```bash
npm run build
```

Then verify these routes return 200 locally if a dev server is available:

```bash
/connections
/clients
```

If a real client exists, also verify:

```bash
/clients/[id]/connections
```

If no client exists locally, state that the dynamic client route was not smoke-tested.

## Output expected

Return a short summary with:

- files changed;
- what improved for Meta setup;
- build result;
- any route smoke tests performed;
- anything that still needs a real Meta account/token.
