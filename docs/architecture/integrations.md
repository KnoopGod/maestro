# Intégrations externes — MAESTRO

## Anthropic Claude

**Usage** : génération de texte, analyse d'images, supervision qualité.
**SDK** : `@anthropic-ai/sdk`
**Variable** : `ANTHROPIC_API_KEY`

| Agent | Modèle | Rôle |
|-------|--------|------|
| `social-expert.ts` | claude-sonnet-4-6 | Captions + hashtags |
| `account-director.ts` | claude-sonnet-4-6 | Analyse brief client |
| `supervisor.ts` | claude-sonnet-4-6 | Contrôle qualité |
| `vision-analyzer.ts` | claude-sonnet-4-6 | Analyse images uploadées |
| `visual-identity.ts` | claude-sonnet-4-6 | Synthèse DA client |
| `strategy-advisor.ts` | claude-sonnet-4-6 | Stratégie client |

**Pattern de parsing** : les réponses JSON de Claude sont parsées avec try/catch + fallback regex pour gérer le wrapping markdown.

```typescript
try {
  return JSON.parse(content);
} catch {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return JSON.parse(match[1]);
  throw new Error('Claude response could not be parsed as JSON');
}
```

## OpenAI

**Usage** : génération d'images.
**SDK** : `openai`
**Variable** : `OPENAI_API_KEY`
**Modèle** : `gpt-image-1` (agent `image-generator.ts`)

Les images générées sont stockées comme base64 puis écrites sur disque/Blob.

## Meta (Facebook + Instagram)

**API** : Graph API v23.0
**Variables** :
- Tokens stockés dans `client_social_accounts.access_token` ⚠️ en clair
- `CODEXRS_PUBLIC_URL` — URL HTTPS publique pour que Meta accède aux images

### Flux OAuth

```
/clients/[id]/connections
    → /api/meta/connect  (échange code → token court)
    → /api/meta/discover (liste pages FB + comptes IG)
    → sauvegarde dans client_social_accounts
```

### Publication

```
post.platforms = ['facebook', 'instagram']
    → meta-publisher.ts
        → Facebook: POST /me/feed ou /photo (selon image)
        → Instagram: POST /container puis /publish
```

**Contrainte** : Meta ne peut pas accéder à `localhost`. `CODEXRS_PUBLIC_URL` doit être une URL HTTPS publique (ngrok, Vercel, etc.).

### Routes Meta

| Route | Usage |
|-------|-------|
| `POST /api/meta/connect` | Échange token OAuth |
| `POST /api/meta/discover` | Liste les pages/comptes disponibles |
| `POST /api/meta/debug-token` | Vérifie la validité d'un token |
| `POST /api/meta/test-post` | Test de publication sans commit |

## Turso (production DB)

**Usage** : remplacement de `maestro.db` en production.
**Variables** : `DATABASE_URL`, `DATABASE_AUTH_TOKEN`
**SDK** : `@libsql/client`

En dev, `DATABASE_URL` est vide → utilise `file:./maestro.db`.
En prod, `DATABASE_URL` pointe vers l'instance Turso.

## Vercel Blob (production storage)

**Usage** : stockage des médias en production (remplace `public/uploads/`).
**Variable** : `BLOB_READ_WRITE_TOKEN`
**SDK** : `@vercel/blob`

`lib/storage/local.ts` abstrait le stockage — si `BLOB_READ_WRITE_TOKEN` est défini, utilise Blob ; sinon, écrit dans `public/uploads/`.

## Vercel Cron

Déclaré dans `vercel.json` :
```json
{
  "crons": [{ "path": "/api/cron/publish-due", "schedule": "*/15 * * * *" }]
}
```
Déclenche la publication des posts planifiés toutes les 15 minutes.

## Résumé des variables d'environnement requises

| Variable | Obligatoire | Usage |
|----------|-------------|-------|
| `ANTHROPIC_API_KEY` | Dev + Prod | Claude agents |
| `OPENAI_API_KEY` | Dev + Prod | Image generation |
| `CODEXRS_PASSWORD` | Dev + Prod | Login password |
| `CODEXRS_PUBLIC_URL` | Prod | Meta image access |
| `DATABASE_URL` | Prod | Turso connection |
| `DATABASE_AUTH_TOKEN` | Prod | Turso auth |
| `CRON_SECRET` | Prod | Cron endpoint protection |
| `BLOB_READ_WRITE_TOKEN` | Prod | Vercel Blob storage |
