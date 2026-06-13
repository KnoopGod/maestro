# Architecture — Vue d'ensemble

## Quatre couches

```
┌─────────────────────────────────────────────┐
│  UI — Next.js 16.2.6 (App Router)           │
│  app/         Server Components              │
│  components/  Client Components ('use client')│
└─────────────────┬───────────────────────────┘
                  │ fetch / Server Actions
┌─────────────────▼───────────────────────────┐
│  API Routes — app/api/**/route.ts            │
│  Parsing requête → appel agent/query → réponse│
└─────────────────┬───────────────────────────┘
                  │ appelle
┌─────────────────▼───────────────────────────┐
│  Agents — lib/agents/*.ts                    │
│  Fonctions pures : contexte → API → données  │
│  Ne touchent jamais la DB directement        │
└─────────────────┬───────────────────────────┘
                  │ via lib/db/queries/
┌─────────────────▼───────────────────────────┐
│  Base de données — LibSQL / Turso            │
│  ./maestro.db (local) ou Turso (production)  │
└─────────────────────────────────────────────┘
```

## Middleware (`proxy.ts`)

Le fichier `proxy.ts` à la racine sert de middleware Next.js pour l'authentification.
Il intercepte toutes les requêtes, vérifie le cookie de session, et redirige vers `/login` si nécessaire.

Routes publiques (pas d'auth requise) :
- `/login`, `/api/auth/login`, `/api/auth/logout`
- `/api/cron/publish-due` (protégé par `CRON_SECRET` séparément)
- `/privacy`, `/data-deletion`

## Workflow de génération

```
POST /api/studio/generate-post
  → runPostPipeline()
    ├── runAccountDirector()   — analyse client, enrichit brief
    ├── generateCaption()      — captions + hashtags
    ├── generateAndStoreImage()— image IA (optionnel)
    └── supervisePost()        — contrôle qualité + verdict
  → POST /api/studio/publish-post (action humaine)
    └── publishPost()
          └── Meta Graph API v23.0
```

## Suivi des agents

Chaque exécution de pipeline crée un `AgentJob` et des `AgentEvent` en DB.
La page `/agents` affiche l'historique et le détail de chaque job.

```
agent_jobs
  id, client_id, status, trigger, brief_summary, total_cost, started_at
  └── agent_events
        id, job_id, agent, sequence, status, task_label, cost, duration_ms
```

## Stockage des médias

```
Dev local   → public/uploads/clients/<clientId>/<filename>
              Servi statiquement par Next.js
Production  → Vercel Blob (BLOB_READ_WRITE_TOKEN requis)
              URL publique accessible par Meta
```

**Important** : Meta Graph API doit pouvoir accéder aux URLs des images.
`localhost` est interdit. `CODEXRS_PUBLIC_URL` doit être une URL HTTPS publique.
