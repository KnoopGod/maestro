# Architecture frontend — MAESTRO

## Technologie

Next.js 16.2.6 avec App Router, React 18, TypeScript 5.x, Tailwind CSS, Turbopack (dev).

## Structure des pages

```
app/
├── layout.tsx              — Layout racine (Sidebar, TopBar, BottomNav)
├── page.tsx                — Home → redirige vers /clients
├── login/                  — Page d'authentification
├── clients/
│   ├── page.tsx            — Liste des clients
│   ├── new/                — Création d'un client
│   └── [id]/
│       ├── page.tsx        — Profil client
│       ├── edit/           — Édition du profil
│       ├── setup/          — Configuration initiale (DA, brief)
│       ├── connections/    — Connexions Meta OAuth
│       ├── library/        — Médiathèque du client
│       ├── agents/         — Suivi des jobs IA du client
│       ├── analytics/      — Performance des posts
│       ├── finance/        — Suivi financier
│       ├── launch/         — Tunnel de lancement
│       └── report/         — Rapport client
├── studio/                 — Générateur de posts (StudioForm)
├── validation/             — File d'approbation des posts
├── calendar/               — Calendrier de publication
├── library/                — Médiathèque globale
├── connections/            — Connexions sociales globales
├── agents/                 — Agent Activity Center global
├── analytics/              — Analytics globales
├── usage/                  — Tableau de bord des coûts IA
├── settings/               — Paramètres de l'application
└── [legacy: à supprimer]   — dashboard, models, task-router, token-economy,
                              work-memory, resume-for-claude, setup-guide
```

## Server Components vs Client Components

**Règle** : Server Component par défaut. `'use client'` uniquement si état, événement ou animation.

| Composant | Type | Raison |
|-----------|------|--------|
| `app/*/page.tsx` | Server | Fetch DB côté serveur |
| `components/layout/Sidebar.tsx` | Client | Navigation active, état |
| `components/layout/BottomNav.tsx` | Client | Navigation active mobile |
| `components/studio/StudioForm.tsx` | Client | Formulaire long, état complexe |
| `components/library/UploadZone.tsx` | Client | Drag & drop, upload |
| `components/ui/SubmitButton.tsx` | Client | `useFormStatus` |
| `components/clients/MetaConnectionWizard.tsx` | Client | Wizard multi-étapes |

## Layout principal

`app/layout.tsx` charge :
- `Sidebar` (desktop, fixe à gauche)
- `TopBar` (titre de page, actions contextuelles)
- `BottomNav` (mobile, navigation principale)
- Skips sidebar sur `/login`

## Composants de base (`components/ui/`)

| Composant | Usage |
|-----------|-------|
| `EmptyState` | État vide avec CTA |
| `SubmitButton` | Bouton de formulaire avec `useFormStatus` |
| `StatusDot` | Indicateur coloré de statut |
| `AIBadge` | Badge "Généré par IA" |
| `CostBadge` | Affiche un coût en USD |
| `GaugeBar` | Barre de progression stylisée |
| `WipTag` | Tag "Work in Progress" |

Composants Radix UI : `badge`, `button`, `card`, `dialog`, `progress`, `select`, `switch`, `tabs`, `tooltip`.

## Conventions de routing

- URL en français → à garder (préférence Bradley)
- Paramètres dynamiques : `[id]` pour client, `[assetId]` pour asset
- Pas de route group `(group)` pour l'instant
- `loading.tsx` non implémenté — à ajouter en Phase 5

## Formulaires et Server Actions

Deux patterns coexistent :
1. **Server Actions** (`lib/actions/`) — `clients.ts` (création, édition client), `finance.ts`
2. **fetch vers API Route** — `StudioForm` appelle `/api/studio/generate-post`

Les Server Actions utilisent `revalidatePath()` pour invalider le cache après mutation.

## Gestion des erreurs

- `app/error.tsx` — erreur runtime React
- `app/global-error.tsx` — erreur root layout
- `app/not-found.tsx` — 404
- Erreurs API : les composants affichent un message inline, pas de redirect

## Styles

Tailwind CSS avec mode dark uniquement. Pas de `light:` prefix.
Variables CSS dans `app/globals.css` (couleurs, radius).
Pas de styled-components, pas de CSS modules.
