# Session Handoff — Maestro

> **Pour Claude (toute future session)** : lis ce document + `CLAUDE.md` en entier avant d'agir.

**Dernière mise à jour** : 28 mai 2026 (session 3)  
**Propriétaire** : Bradley Dave (knoopleague@gmail.com)  
**Repo** : https://github.com/KnoopGod/maestro (privé)  
**Prod** : https://maestro-green.vercel.app  

---

## 🎯 Le projet en une phrase

**Maestro** est une plateforme Next.js 16 / LibSQL / TypeScript qui pilote les réseaux sociaux des clients HORECA (hôtels, restaurants, cafés, bars, B&B) avec des agents IA spécialisés (Claude Opus 4.7 + OpenAI gpt-image-1 + Meta Graph API).

---

## 🧱 Stack & emplacement

- **Code** : `/home/user/maestro` (en session cloud) ou `/Users/bradleydave/Dev/ai-command-center` (local — nom legacy)
- **Stack** : Next.js 16.2.6 App Router, LibSQL/Turso, Tailwind dark theme, port **3010**
- **Dev** : `npm run dev` — type check : `npx tsc --noEmit`
- **Prod** : Vercel (auto-deploy sur push `main`), Turso cloud DB, Vercel Blob storage

---

## ✅ État complet livré

### Agents (`lib/agents/`)

| Agent | Rôle | Fichier | Statut |
|---|---|---|---|
| Account Director | Enrichit le brief, lit l'historique client | `account-director.ts` | ✅ actif |
| Strategy Director (Planner) | 5 idées de posts par pilier | `planner.ts` | ✅ actif |
| Social Expert | Captions multi-plateformes + brand voice + DA | `social-expert.ts` | ✅ actif |
| Visual Director | Image IA alignée DA via OpenAI gpt-image-1 | `image-generator.ts` | ✅ actif |
| DA Curator | Synthèse Direction Artistique depuis assets | `visual-identity.ts` | ✅ actif |
| Vision Analyzer | Tag chaque photo (palette, mood, sujets) | `vision-analyzer.ts` | ✅ actif |
| Supervisor | Quality gate ready/revise/blocked avant pub | `supervisor.ts` | ✅ actif |
| Publisher | Facebook + Instagram via Meta Graph API | `meta-publisher.ts` | ✅ actif |
| Performance Analyst | Insights post-pub + recommandations Claude | `performance-analyst.ts` | ✅ actif |
| Video Creator | Image → Reel via Luma Dream Machine | `video-creator.ts` | ✅ actif |
| Strategy Advisor | Stratégie marketing complète par client (Opus 4.7) | `strategy-advisor.ts` | ✅ actif |
| Impact Scorer | Score 0–100 heuristique | `impact-scorer.ts` | ✅ actif |
| Pipeline orchestrator | Account → Social → Visual → Supervisor | `pipeline.ts` | ✅ actif |
| Publish pipeline | Supervisor gate + Meta publish | `publish-pipeline.ts` | ✅ actif |

### Pipeline de tracking (`lib/agents/tracking.ts`)

`withTracking()` — wrapper transparent autour de chaque agent :
- Écrit `agent_events` en DB (pending → running → completed/failed/skipped)
- Rethrow les erreurs après avoir tracé le failure
- `skipTracking()` pour les steps conditionnels (ex: asset existant)

### Pages UI (`app/`)

| Route | Description |
|---|---|
| `/` | Home — stats, actions rapides, liste clients |
| `/clients` | Liste des clients avec filtres par type |
| `/clients/[id]` | Fiche client — DA, brand voice, stratégie IA, connexions |
| `/clients/[id]/edit` | Édition client |
| `/clients/[id]/library` | Assets + Vision Analyzer + DA Curator |
| `/clients/[id]/connections` | Wizard Meta OAuth (avec checklist pré-requis 4 étapes) |
| `/clients/[id]/setup` | Tunnel d'onboarding 6 étapes |
| `/clients/[id]/agents` | Agents actifs pour ce client |
| `/clients/new` | Création client |
| `/studio` | Générateur de post (Account Director → Social → Visual → Supervisor) |
| `/validation` | File de relecture des drafts |
| `/calendar` | Vue chronologique + "Publier les posts dus" |
| `/plan` | Historique de tous les posts avec filtres |
| `/agents` | **[NOUVEAU]** Activité en direct + pipeline visuel + registre agents |
| `/agents/jobs/[id]` | **[NOUVEAU]** Timeline détaillée d'un job avec polling 2s |
| `/analytics` | Performance Analyst par client |
| `/connections` | Guide connexions globales (6 services) |
| `/library` | Bibliothèque globale multi-clients |
| `/usage` | Coûts IA par client / mois |
| `/settings` | Paramètres |
| `/login` | Auth page (`CODEXRS_PASSWORD`) |

### API routes (`app/api/`)

| Route | Rôle |
|---|---|
| `POST /api/studio/generate-post` | Pipeline complet — crée un `agent_job` + 4 events trackés |
| `POST /api/studio/publish-post` | Publication Meta — crée un job Publisher séparé |
| `GET /api/agents/jobs` | Liste des 40 derniers jobs |
| `GET /api/agents/jobs/[id]` | Job + events (polling endpoint) |
| `POST /api/clients/[id]/strategy` | Génère stratégie IA (Opus 4.7) |
| `GET /api/clients/[id]/performance` | Insights Meta + recommandations |
| `POST /api/clients/[id]/assets/[assetId]/animate` | Luma image → vidéo |
| `POST /api/meta/discover` | Découverte pages FB + comptes IG |
| `POST /api/meta/connect` | Sauvegarde Page Access Token |
| `GET /api/meta/debug-token` | Diagnostique token + scopes |
| `POST /api/posts/propose` | Planner — idées de posts |
| `POST /api/posts/[id]/supervise` | Re-supervise un post |
| `POST/DELETE /api/posts/[id]/schedule` | Planifier/déplanifier |
| `GET /api/cron/publish-due` | Publie les posts planifiés (CRON_SECRET requis) |
| `GET /api/health` | Statut toutes les dépendances + DB |

### Schéma DB (`lib/db/schema.ts` + migrations 001–005)

Tables actives :
- `clients` — profil HORECA complet
- `client_social_accounts` — tokens Meta/IG/TikTok (clear, TODO encrypt)
- `client_agents` — assignments agents
- `client_assets` — photos/vidéos/docs analysés
- `client_visual_identity` — DA synthétisée (style_prompt injecté partout)
- `posts` — pipeline de publication (`draft|ready|scheduled|published|failed`)
- **`agent_jobs`** — [NOUVEAU] un job par génération/publication
- **`agent_events`** — [NOUVEAU] un event par étape agent dans le job

### Sécurité & auth

- **Proxy** (`proxy.ts`) — HMAC session cookie via Web Crypto API (Edge-compatible)
- **Login** (`/login`) — mot de passe unique `CODEXRS_PASSWORD` (`MAESTRO_PASSWORD` fallback legacy)
- **Logout** (`/api/auth/logout`) — supprime les cookies `codexrs_session` et legacy
- **Cron** — `CRON_SECRET` requis (timing-safe comparison)
- **Upload** — whitelist MIME + limite 100 MB + path traversal fix

### Mobile & Accessibilité

- **Bottom navigation** — remplace la sidebar sur mobile (`components/layout/BottomNav.tsx`)
- **Responsive** — grilles adaptatives sur toutes les pages clés
- **WCAG 2.1 AA** — 8 corrections : `:focus-visible`, landmarks ARIA, `aria-hidden`, `aria-current`, `aria-label`, touch targets 44px, labels formulaire, `role="alert"` erreurs
- **Skip link** — "Aller au contenu principal" (visible au focus clavier)

---

## 🔑 Variables d'environnement

```
ANTHROPIC_API_KEY=sk-ant-...          # Requis — Opus 4.7
OPENAI_API_KEY=sk-...                 # Requis — gpt-image-1
CODEXRS_PASSWORD=...                  # Auth unique (vide = dev sans auth)
META_APP_ID=...                       # Optionnel — exchange token long
META_APP_SECRET=...                   # Optionnel
CODEXRS_PUBLIC_URL=https://...        # Requis prod — Meta fetche les images
CRON_SECRET=...                       # Protège /api/cron/publish-due
DATABASE_URL=file:./maestro.db        # Dev local (ou libsql://... pour Turso)
DATABASE_AUTH_TOKEN=...               # Requis si Turso
BLOB_READ_WRITE_TOKEN=...             # Vercel Blob — auto-injecté si store connecté
LUMA_API_KEY=...                      # Optionnel — Video Creator agent
```

---

## 📦 Infrastructure prod

| Service | État | Notes |
|---|---|---|
| Vercel | ✅ déployé | Auto-deploy sur push `main`. Hobby plan : 1 cron/jour max |
| Turso | ✅ connecté | `libsql://maestro-knoopgod.aws-ap-northeast-1.turso.io` |
| Vercel Blob | ✅ configuré | Images IA stockées en HTTPS public (Meta peut les fetcher) |
| Meta App | ⚠️ à connecter | Instagram doit être en mode Business + lié à la Page FB |
| CRON | ✅ configuré | `0 8 * * *` — publie les posts planifiés chaque matin à 8h |

---

## ✅ V1 terminée — tout est réel

**Session 3 — tous les points V1 corrigés :**
- `listClientsWithStats()` — vraies requêtes SQL (plus de `Math.random()`)
- Fiche client : stats réelles (posts générés, planifiés, impact score moyen)
- "Plateformes connectées" — lit `client_social_accounts`, bouton "Connecter" lié à `/connections`
- "Posts récents" — 4 derniers vrais posts avec statut et date
- "Activité agents" — 8 derniers `agent_jobs` par client, lien vers timeline détaillée
- Recherche globale `/search` — clients + posts par texte (SQL LIKE)
- TopBar search — form submit navigue vers `/search?q=...`
- Analytics grid responsive (`grid-cols-2 lg:grid-cols-4`)
- "À valider" home page — vraie requête COUNT draft|ready

## 🚧 Prochaines priorités

1. **Connecter le premier compte Meta** — aller sur `/clients/[id]/connections`, suivre la checklist 4 étapes, coller un token depuis Graph API Explorer
2. **Tester le pipeline complet avec image** — générer un post avec image → Meta publish → vérifier que BLOB_READ_WRITE_TOKEN est défini
3. **Performance Analyst actif** — câbler les webhooks Meta pour récupérer les vraies métriques post-publication (reach, impressions, saves)
4. **Recherche avancée** — ajouter agents dans les résultats de `/search`, filtres par statut/date

---

## 🎨 Conventions importantes

- **Français** pour l'UI (labels, messages). **Anglais** pour le code.
- **Server Components** par défaut. `'use client'` seulement si état ou événement.
- **DB queries** retournent camelCase ; colonnes SQL snake_case. Voir helpers `mapRow`.
- **Tailwind dark** : `bg-gray-950` fond, `bg-gray-900/40` cartes, `border-gray-800`, accent `purple-600`.
- **Status colors** : emerald (success), amber (warning), red (error), purple (primary).
- **Opus 4.7 pricing** : `(input × 5 + output × 25) / 1_000_000`. Agents Opus utilisent `thinking: { type: 'adaptive' }`.
- **JSON parsing** : strip markdown fences + regex fallback (voir `social-expert.ts` pour le pattern).
- **Tracking** : tout nouvel agent doit être wrappé avec `withTracking()` de `lib/agents/tracking.ts`.

---

## 🐞 Debug

### Publication Meta échoue
1. `/clients/[id]/connections` → « Diagnostiquer le token » → vérifier scopes
2. `pages_manage_posts` manquant → ajouter use case dans Meta Developer
3. Erreur #200 → utilisateur doit être **Admin** (pas Éditeur) de la Page
4. Instagram sans image → vérifier `BLOB_READ_WRITE_TOKEN` défini

### Migration DB non appliquée
```bash
npx tsx -e "import { initSchema } from './lib/db/schema'; initSchema().then(() => console.log('OK'))"
```

### Dev server
```bash
npm run dev   # port 3010
```

---

## 📋 Reprendre cette session

**Prompt pour une nouvelle session Claude** :

> Lis `SESSION_HANDOFF.md` et `CLAUDE.md`. Je veux reprendre le travail sur Maestro. La prochaine priorité est [voir section "Prochaines priorités"]. Vérifie l'état du projet avant de proposer quoi que ce soit.
