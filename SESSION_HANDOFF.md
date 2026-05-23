# Session handoff — Maestro

> **Pour Claude (toute future session)** : ce document te donne le contexte complet pour reprendre le travail sur Maestro. Lis-le en entier avant d'agir. Le reste du projet est documenté dans [CLAUDE.md](./CLAUDE.md) — lis-le aussi.

**Dernière mise à jour** : 23 mai 2026
**Propriétaire** : Bradley Dave (knoopleague@gmail.com)
**Repo** : https://github.com/KnoopGod/maestro (privé)

---

## 🎯 Le projet en une phrase

**Maestro** est une plateforme Next.js 16 / LibSQL / TypeScript qui pilote les réseaux sociaux des clients HORECA (hôtels, restaurants, cafés, bars, B&B) avec des agents IA (Claude Opus 4.7 + OpenAI gpt-image-1 + Meta Graph API).

## 🧱 Stack & emplacement

- **Code** : `/Users/bradleydave/Dev/ai-command-center` (le dossier s'appelle ainsi pour raisons historiques, mais le produit s'appelle Maestro)
- **Stack** : Next.js 16.2.6 (App Router, port **3010**), LibSQL (`./maestro.db`), Tailwind dark theme
- **Dev server** : `npm run dev` (jamais le port 3000 — toujours 3010)
- **Type check rapide** : `npx tsc --noEmit`

## ✅ Ce qui est livré

### Agents (`lib/agents/`)
| Agent | Rôle | Fichier |
|---|---|---|
| Account Director | Enrichit le brief en lisant l'historique des posts du client | `account-director.ts` |
| Strategy Director (Planner) | Propose 5 idées de posts variées par client | `planner.ts` |
| Social Expert | Captions multi-plateformes avec brand voice + DA | `social-expert.ts` |
| Visual Director (Image Generator) | Génère l'image alignée DA via OpenAI | `image-generator.ts` |
| DA Curator (Visual Identity) | Synthétise la DA depuis les assets uploadés | `visual-identity.ts` |
| Vision Analyzer | Tag chaque photo (palette, mood, sujets) | `vision-analyzer.ts` |
| Supervisor | Quality gate avant publication (ready/revise/blocked) | `supervisor.ts` |
| Publisher | Publie sur Facebook + Instagram via Meta Graph | `meta-publisher.ts` |
| Pipeline orchestrator | Chaîne Account → Social → Visual → Supervisor | `pipeline.ts` |
| Publish pipeline | Factorise publish-post + cron | `publish-pipeline.ts` |
| Impact Scorer | Score 0-100 heuristique pour un post | `impact-scorer.ts` |

### Registries (`lib/`)
- `agent-registry.ts` — descripteurs des 10 agents (alimente `/agents` UI)
- `connection-registry.ts` — 6 connexions externes (alimente `/connections` UI)

### Pages UI (`app/`)
- `/` Home avec stats
- `/clients`, `/clients/[id]`, `/clients/[id]/edit`, `/clients/[id]/library`, `/clients/[id]/connections`, **`/clients/[id]/setup`** (tunnel d'onboarding 6 étapes)
- `/studio` (générateur avec PostIdeasPanel + auto-supervision)
- **`/validation`** (file de relecture)
- **`/calendar`** (vue chronologique + bouton « Publier les posts dus »)
- `/plan` (historique de tous les posts)
- `/agents` (10 agents + pipeline visuel)
- **`/connections`** (guide global 6 connexions)
- `/library`, `/analytics`, `/usage`, `/settings`

### API (`app/api/`)
- `/api/studio/generate-post` — chaîne `runPostPipeline` complète
- `/api/studio/publish-post` — utilise `publish-pipeline.ts`
- `/api/posts/propose` — Account Director / Planner
- `/api/posts/[id]/supervise` — re-supervise
- `/api/posts/[id]/schedule` (POST + DELETE) — planifier / déplanifier
- `/api/cron/publish-due` — publie tous les posts dus (header `Authorization: Bearer $CRON_SECRET`)
- `/api/meta/discover`, `/api/meta/connect`, `/api/meta/debug-token` — wizard Meta

### Schéma DB (`lib/db/schema.ts` + migrations)
Tables : `clients`, `client_social_accounts`, `client_agents`, `client_assets`, `client_visual_identity`, `posts`.

`posts.status` : `draft | ready | scheduled | published | failed`. Colonnes notables : `scheduled_at`, `supervisor_review` (JSON), `meta_post_ids` (JSON).

Migrations dans `lib/db/migrations/` (idempotentes, appelées par `initSchema()`).

## 🔑 Variables d'environnement (`.env.local`, non commité)

```
ANTHROPIC_API_KEY=sk-ant-...          # Requis — Opus 4.7
OPENAI_API_KEY=sk-...                  # Requis — gpt-image-1
META_APP_ID=...                        # Optionnel — exchange token long
META_APP_SECRET=...
MAESTRO_PUBLIC_URL=https://...         # Requis prod — pour que Meta fetche les images
CRON_SECRET=...                        # Optionnel — protège /api/cron/publish-due
DATABASE_URL=file:./maestro.db         # Par défaut
```

## 🚧 Ce qui reste à faire (TODO ordre de priorité)

1. **Tester en réel la chaîne complète** Studio → Supervisor → Schedule → Cron sur un client live (Pink House / IBRODEPRO). Bloqué uniquement sur action utilisateur Meta token.
2. **Deploy public** : Vercel ou Cloudflare Tunnel pour avoir un `MAESTRO_PUBLIC_URL` non-localhost (débloque Instagram publishing).
3. **Performance Analyst agent** — registry décrit l'agent (#7) mais aucune implémentation. Lit les métriques Meta post-publication, propose 3 reco actionnables. À spec via CODEX_SPECS/004.
4. **Library picker dans Studio** — actuellement Studio génère toujours une nouvelle image. Permettre de choisir une asset existante du client.
5. **Bulk generation** — bouton « Générer les 5 idées » qui crée 5 drafts en parallèle depuis le PostIdeasPanel.
6. **Video agent** (Luma/Kling/Runway) — registry décrit l'agent (#8) mais aucune implémentation.

## 🎨 Conventions importantes

- **Français pour l'UI** (labels, prompts, messages d'erreur). **Anglais pour le code**.
- **Server Components** par défaut. `'use client'` seulement si interactivité.
- **DB queries** retournent camelCase ; colonnes SQL snake_case. Voir helpers `mapRow`.
- **Tailwind dark theme** : `bg-gray-950` fond, `bg-gray-900/40` cartes, `border-gray-800`, accent `purple-600`.
- **Status colors** : emerald (success), amber (warning), red (error), purple (primary).
- **Opus 4.7 pricing** : `(input * 5 + output * 25) / 1_000_000`. Tous les agents Opus utilisent `thinking: { type: 'adaptive' }` + `output_config: { effort: 'high' }`.
- **JSON parsing robuste** : strip markdown fences + regex fallback (voir `lib/agents/social-expert.ts` pour le pattern canonique).

## 🧑‍💻 Pattern Codex (executor)

Quand le travail est de la génération de code routinier, j'écris une spec dans `CODEX_SPECS/NNN-feature.md`, puis l'exécute avec :

```bash
codex exec --cd /Users/bradleydave/Dev/ai-command-center --sandbox workspace-write \
  "Read CODEX_SPECS/NNN-feature.md and execute it precisely. Report the summary at the end."
```

Codex CLI : `/Users/bradleydave/.local/bin/codex` (v0.133+). Specs déjà exécutées :
- 001 — ClientStrategy integration
- 002 — Supervisor agent
- 003 — Account Director + Pipeline orchestrator

## 🐞 Debug

### Publication Meta échoue
1. `/clients/[id]/connections` → « Diagnostiquer le token » → vérifier scopes
2. Si `pages_manage_posts` manque → ajouter use case « Tout gérer sur votre Page » dans Meta Developer
3. Si erreur #200 → vérifier que l'utilisateur est **Admin** de la page (pas Editor)
4. Si Instagram échoue → confirmer `MAESTRO_PUBLIC_URL` non-localhost

### Migration DB n'a pas tourné
- L'init appelle `migratePostsScheduling()` automatiquement
- Force : `npx tsx -e "import('./lib/db/migrations/002-add-scheduling').then(m => m.migratePostsScheduling())"`

## 📦 Reprendre cette session

**Prompt à donner au Claude (mobile ou ailleurs)** :

> Lis `SESSION_HANDOFF.md` et `CLAUDE.md`. Je veux reprendre le travail sur Maestro où on s'est arrêté. La prochaine priorité est [TODO #N de la liste]. Pose-moi les questions nécessaires avant de coder.

Ou si tu veux une tâche précise :

> Lis `SESSION_HANDOFF.md` puis exécute la spec Codex `CODEX_SPECS/004-performance-analyst.md` (à créer en suivant le pattern des specs 001-003).
