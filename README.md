# MAESTRO — Plateforme de production de contenus IA pour les agences HORECA

MAESTRO automatise la création, la validation et la publication de contenus sur les réseaux sociaux pour les clients HORECA (restaurants, hôtels, bars, B&Bs).

---

## Démarrage rapide

### Prérequis

- Node.js 20+
- npm 10+
- Clés API : Anthropic (requis), OpenAI (requis pour les images)

### Installation

```bash
git clone https://github.com/KnoopGod/maestro.git
cd maestro
npm install
cp .env.example .env.local   # puis remplir les variables
```

### Variables d'environnement minimales

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
CODEXRS_PASSWORD=ton_mot_de_passe_admin
```

### Lancer en développement

```bash
npm run dev
# Ouvre http://localhost:3010
```

### Initialiser la base de données

```bash
# La DB s'initialise automatiquement au premier lancement.
# Pour repartir de zéro avec des clients de test :
rm maestro.db
npx tsx lib/db/seed.ts
```

---

## Architecture

```
UI (Next.js 16.2.6 — App Router)
├── app/               Pages et routes API
├── components/        Composants React
└── lib/
    ├── agents/        Agents IA (orchestration + appels API)
    ├── db/            Schéma, migrations, queries LibSQL
    ├── auth/          Session et middleware
    └── storage/       Stockage fichiers local/Vercel Blob
```

## Workflow de production

```
Client → Strategy → Library → Studio → Validation → Calendrier → Publication → Analytics
```

1. **Studio** — Rédige un brief, MAESTRO génère le post (caption + image) via 4 agents IA.
2. **Validation** — Le Supervisor IA donne un verdict. L'admin valide avant publication.
3. **Calendrier / Publication** — Planification ou publication immédiate sur Facebook/Instagram.
4. **Analytics** — Suivi des performances des posts publiés.

---

## Agents IA

| Agent | Rôle | Modèle |
|---|---|---|
| Account Director | Analyse client + brief enrichi | Claude Sonnet 4.6 |
| Social Expert | Captions + hashtags multi-plateforme | Claude Sonnet 4.6 |
| Visual Director | Génération image avec Direction Artistique | gpt-image-1 |
| Supervisor | Contrôle qualité + verdict | Claude Sonnet 4.6 |
| Vision Analyzer | Analyse des assets uploadés | Claude Vision |
| Meta Publisher | Publication Facebook + Instagram | Meta Graph API v23 |

---

## Commandes utiles

```bash
npm run dev              # Dev sur :3010
npm run build            # Build production
npm run lint             # ESLint
npx tsc --noEmit         # Vérification TypeScript

# DB
npx tsx lib/db/seed.ts   # Seed clients HORECA mock
```

---

## Variables d'environnement complètes

| Variable | Requis | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Oui | Claude Sonnet 4.6 + Vision |
| `OPENAI_API_KEY` | Oui | Génération images (gpt-image-1) |
| `CODEXRS_PASSWORD` | Recommandé | Mot de passe admin (désactive l'auth si absent) |
| `CODEXRS_PUBLIC_URL` | Prod | URL HTTPS publique pour que Meta accède aux images |
| `DATABASE_URL` | Prod | URL Turso (défaut : `file:./maestro.db`) |
| `DATABASE_AUTH_TOKEN` | Prod | Token Turso (uniquement si DATABASE_URL est Turso) |
| `META_APP_ID` | Optionnel | Active l'échange de token long-durée Meta |
| `META_APP_SECRET` | Optionnel | Secret de l'app Meta |
| `CRON_SECRET` | Prod | Secret Vercel Cron pour `/api/cron/publish-due` |
| `BLOB_READ_WRITE_TOKEN` | Prod | Vercel Blob pour les assets uploadés |
| `LUMA_API_KEY` | Optionnel | Génération vidéo (future) |

---

## Déploiement sur Vercel

1. Lier le dépôt GitHub à un projet Vercel.
2. Configurer les variables d'environnement dans Vercel Dashboard.
3. Utiliser une base Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`).
4. Définir `CODEXRS_PUBLIC_URL` sur l'URL de production HTTPS.
5. Le cron `/api/cron/publish-due` est configuré dans `vercel.json` (08h00 UTC).

---

## Documentation

- `docs/product/` — Vision, roadmap, décisions, glossaire
- `docs/architecture/` — Architecture technique détaillée
- `docs/features/` — Documentation par fonctionnalité
- `docs/audits/` — Audits techniques, sécurité, performance, UX
- `docs/operations/` — Environnement, déploiement, release process
- `CLAUDE.md` — Règles permanentes du projet (lu par Claude Code)
- `CODEX_SPECS/` — Spécifications d'implémentation pour Codex
