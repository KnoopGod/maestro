# Architecture backend — MAESTRO

## Vue d'ensemble

```
proxy.ts (middleware Next.js)
    ↓ authentification
app/api/**/route.ts  (API Routes)
    ↓ parse + délègue
lib/agents/*.ts      (logique IA)
lib/db/queries/*.ts  (accès données)
    ↓
maestro.db / Turso
```

## Middleware d'authentification (`proxy.ts`)

Fichier à la racine du projet, exporté comme middleware Next.js via `matcher` dans `next.config`.
Vérifie le cookie `codexrs_session` (HMAC-SHA256) sur toutes les routes sauf `PUBLIC_PATHS`.

```typescript
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health', '/privacy', '/data-deletion']
```

**Attention** : le nom `proxy.ts` est non standard. À renommer en `middleware.ts` en Phase 1.

## Routes API

### Organisation

```
app/api/
├── auth/
│   ├── login/route.ts      — POST: vérifie mot de passe, crée session
│   └── logout/route.ts     — POST: supprime cookie
├── clients/[id]/
│   ├── assets/route.ts     — GET/POST: upload médias
│   ├── assets/[assetId]/route.ts  — DELETE
│   ├── analyze-da/route.ts — POST: lance visual-identity agent
│   ├── launch/route.ts     — POST: étapes tunnel de lancement
│   ├── performance/route.ts — POST: fetch insights Meta
│   ├── profit/route.ts     — GET: calcul rentabilité
│   └── strategy/route.ts   — POST: génère stratégie client
├── posts/[id]/
│   ├── route.ts            — PATCH/DELETE: mise à jour statut
│   ├── schedule/route.ts   — POST: planification
│   ├── supervise/route.ts  — POST: re-supervision
│   ├── regenerate-caption/route.ts — POST: régénère le texte
│   └── insights/route.ts   — POST: sync insights Meta
├── studio/
│   ├── generate-post/route.ts  — POST: pipeline complet ⚠️ bloquant 30-90s
│   ├── generate-caption/route.ts — POST: texte seul
│   ├── suggest-brief/route.ts  — POST: suggestions de brief
│   └── publish-post/route.ts   — POST: publie immédiatement
├── meta/
│   ├── connect/route.ts    — POST: échange token OAuth
│   ├── discover/route.ts   — POST: liste pages/comptes
│   ├── debug-token/route.ts — POST: vérifie token
│   └── test-post/route.ts  — POST: test de publication
├── cron/
│   └── publish-due/route.ts — POST: publie les posts planifiés (Vercel Cron)
├── agents/
│   └── jobs/[id]/route.ts  — GET: état d'un job IA
├── health/route.ts          — GET: état de l'application (public)
└── [legacy]
    ├── chatgpt/route.ts
    ├── claude/route.ts
    ├── ollama/route.ts
    └── router/route.ts
```

### Pattern standard d'une route API

```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 1. Parse body avec try/catch
  // 2. Valider que la ressource existe
  // 3. Appeler agent ou query
  // 4. Retourner Response.json({...})
}
```

Les routes ne contiennent **pas** de logique métier — elles délèguent aux agents et queries.

## Server Actions (`lib/actions/`)

- `clients.ts` — `createClient()`, `updateClient()`, `deleteClient()` avec `revalidatePath()`
- `finance.ts` — opérations financières

Utilisés depuis les pages Next.js (formulaires) pour les mutations simples sans appel IA.

## Couche données (`lib/db/queries/`)

| Fichier | Responsabilité |
|---------|---------------|
| `clients.ts` | CRUD clients + visual identity |
| `posts.ts` | CRUD posts, filtres par statut |
| `assets.ts` | CRUD médias client |
| `social-accounts.ts` | Connexions Meta |
| `agent-jobs.ts` | Suivi jobs IA + events |
| `finance.ts` | Données financières |
| `launch-tunnel.ts` | Étapes tunnel de lancement |
| `usage.ts` | Agrégation coûts IA |

Chaque query retourne des objets camelCase via une fonction `mapRow()`.

## Cron job

`POST /api/cron/publish-due` — déclenché par Vercel Cron (cf. `vercel.json`).
Récupère les posts `scheduled` dont `scheduled_at <= now()`, tente de publier via Meta.
Protégé par header `Authorization: Bearer ${CRON_SECRET}` ou cookie de session.

## Initialisation de la base de données

`lib/db/schema.ts` exporte `initSchema()` — appelé au démarrage de l'app via `lib/db/index.ts`.
Les migrations sont dans `lib/db/migrations/001` à `008`, toutes idempotentes (`IF NOT EXISTS`).
