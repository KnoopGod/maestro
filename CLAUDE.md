# CLAUDE.md — Règles permanentes du projet MAESTRO

Ce fichier est lu avant chaque session de travail. Il définit les règles qui ne changent pas.

---

## Vision produit

MAESTRO est une plateforme de production automatisée de contenus pour les réseaux sociaux, destinée aux agences gérant des clients HORECA (restaurants, hôtels, bars, B&Bs, chambres d'hôtes).

Elle permet de :
- gérer plusieurs clients avec leurs ADN de marque ;
- générer automatiquement des posts (texte + image) via des agents IA spécialisés ;
- valider les contenus en interne et par le client ;
- programmer et publier sur Facebook et Instagram via l'API Meta ;
- suivre les coûts IA, les délais et les performances des publications.

**Cible V1** : outil interne d'agence, un seul utilisateur admin. Pas encore SaaS public.
**Cible V2** : SaaS multi-utilisateurs avec portail client et facturation.

---

## Priorités techniques (dans cet ordre)

1. **Stabilité** — le produit doit fonctionner sans crash ni perte de données
2. **Sécurité** — les tokens sociaux clients ne doivent jamais fuiter
3. **Clarté** — un développeur doit comprendre le code sans avoir besoin de l'auteur
4. **Simplicité utilisateur** — un débutant doit pouvoir utiliser MAESTRO
5. **Performance** — les pages doivent se charger en moins de 2 secondes
6. **Maintenabilité** — chaque fichier a une responsabilité unique
7. **Évolutivité** — l'architecture peut accueillir de nouveaux agents et plateformes

---

## Architecture

### Quatre couches

```
UI (Next.js 16.2.6 — App Router)
    ↓ Server Actions / fetch
API routes (app/api/**/route.ts)
    ↓ appelle
Agents (lib/agents/*.ts)           ← orchestration IA + APIs externes
    ↓ persiste via
Couche données (lib/db/queries/*.ts)
    ↓
LibSQL (./maestro.db local — compatible Turso pour migration cloud)
```

### Agents (`lib/agents/`)

Chaque agent est un module TypeScript avec une ou deux fonctions exportées.
Les agents sont des fonctions pures : reçoivent un contexte, appellent une API externe, retournent des données structurées. **Ils ne touchent jamais directement la DB** — c'est la route API ou le pipeline qui le fait.

Agents actuels :
- `account-director.ts` — analyse le profil client, enrichit le brief
- `social-expert.ts` — génère captions + hashtags (Claude Sonnet 4.6)
- `image-generator.ts` — génère les images (gpt-image-1), stocke dans `client_assets`
- `supervisor.ts` — contrôle qualité + verdict (ready / revise / blocked)
- `vision-analyzer.ts` — analyse les images uploadées (Claude Vision)
- `visual-identity.ts` — synthèse Direction Artistique (DA) du client
- `meta-publisher.ts` — wrappeur Graph API Meta (Facebook + Instagram)
- `pipeline.ts` — orchestrateur principal (Account Director → Social Expert → Image Gen → Supervisor)
- `publish-pipeline.ts` — pipeline de publication avec vérification supervisor

### Stockage

Local : `public/uploads/clients/<clientId>/` — servi en statique.
Production : Vercel Blob (`BLOB_READ_WRITE_TOKEN` requis).
**Meta ne peut pas accéder aux URLs `localhost`** — `CODEXRS_PUBLIC_URL` doit être une URL HTTPS publique.

### Auth (`proxy.ts` → middleware Next.js)

Mot de passe unique (`CODEXRS_PASSWORD`). Session HMAC-SHA256, cookie `codexrs_session`, 30 jours.
Cookie `httpOnly`, `secure` en production, `sameSite=strict`. Les mutations passent aussi par une vérification `Origin` dans `proxy.ts` pour réduire le risque CSRF.

---

## Commandes communes

```bash
npm run dev              # Serveur dev sur :3010 (Turbopack)
npm run build            # Build production (vérifie la compilation)
npm run lint             # ESLint
npx tsc --noEmit         # Vérification TypeScript rapide

# Base de données (LibSQL, fichier ./maestro.db)
npx tsx lib/db/seed.ts   # Seed 6 clients HORECA mock

# MCP server (optionnel, indépendant de l'app)
npm run mcp:build && npm run mcp:start
```

---

## Règles de sécurité

- **Ne jamais afficher, logger ou committer** un secret, token ou clé API.
- **Ne jamais modifier `.env.local`** sauf si explicitement demandé.
- Les tokens Meta (Page Access Tokens) sont actuellement en clair dans la DB. **TODO avant prod** : chiffrer avec AES-256-GCM.
- Toute route API mutante (POST/PATCH/DELETE) doit être protégée par le middleware. Vérifier qu'elle n'est pas dans `PUBLIC_PATHS` de `proxy.ts` sans raison.
- Ne jamais exposer les données d'un client à une route qui n'a pas vérifié que la requête est authentifiée.
- Les uploads de fichiers doivent valider le type MIME côté serveur, pas seulement côté client.
- Ne jamais annoncer que le projet est sécurisé sans audit complet.

---

## Règles de performance

- La génération de post (`/api/studio/generate-post`) est **synchrone et bloquante**. Sur Vercel, le timeout est 60 secondes. **C'est un risque critique** à traiter en Phase 4.
- Ne pas faire d'appel IA redondant. Si la DA du client existe déjà, ne pas la régénérer.
- Les pages Server Component fetchent leurs données en `Promise.all()` quand les requêtes sont indépendantes.
- Ne jamais annoncer un gain de performance sans mesure avant/après.
- Les images uploadées doivent être redimensionnées avant stockage. Ne pas servir des images de 10 Mo.

---

## Règles d'architecture

- **Server Components par défaut.** Client Components uniquement si état, événement ou animation nécessaires. Marquer avec `'use client'`.
- **Un fichier = une responsabilité.** Si un composant dépasse 400 lignes, le découper.
- La logique métier vit dans les agents ou les queries, pas dans les routes API ou les composants React.
- Les routes API ne contiennent que : parsing de la requête, appel à un agent ou query, retour de la réponse.
- Ne pas dupliquer la logique entre le frontend et le backend.
- Les statuts (post, agent job) sont définis dans `types/post.ts` et `lib/db/queries/agent-jobs.ts`. Ne pas écrire des statuts en clair ailleurs.

---

## Règles de nommage

- **Fichiers** : kebab-case pour tous les fichiers TypeScript et Markdown.
- **Variables et fonctions** : camelCase en anglais.
- **Composants React** : PascalCase.
- **Types TypeScript** : PascalCase.
- **Tables SQL** : snake_case.
- **Objets domaine retournés par les queries** : camelCase (voir les fonctions `mapRow`).
- **UI** : textes en français. Code (variables, fonctions, commentaires techniques) en anglais.
- **Branches Git** : `feature/`, `fix/`, `refactor/`, `performance/`, `security/`, `docs/`.

---

## Règles pour les agents IA

Chaque agent doit avoir :
- une **responsabilité unique** clairement nommée ;
- un **input typé** (interface TypeScript) ;
- un **output typé** (interface TypeScript) ;
- un suivi de **coût** (tokens input + output, coût estimé) ;
- un suivi de **durée** (via `withTracking`) ;
- une **gestion d'erreur** qui ne casse pas le pipeline si l'agent est non bloquant ;
- une **version du prompt** commentée dans le code si le prompt a évolué.

Les réponses JSON de Claude sont parsées avec un fallback regex (Claude peut wrapper du JSON dans du markdown). Garder ce pattern pour tout nouvel agent.

Ne jamais appeler un agent depuis un composant React côté client. Toujours passer par une route API.

---

## Règles Git

- **Ne jamais travailler directement sur `main`** pour une modification importante.
- **Une branche par phase ou par fonctionnalité.** Préfixe selon convention (`feature/`, `fix/`, `docs/`, etc.).
- **Commits courts et cohérents.** Un commit = un sujet. Ne pas mélanger refactoring et nouvelle feature.
- **Toujours lancer `npx tsc --noEmit` et `npm run lint` avant de committer.**
- **Toujours pusher la branche sur GitHub** après validation technique locale.
- **Ne jamais fusionner dans `main` sans validation explicite** de Bradley.
- Documenter dans le commit message : fichiers concernés, risques, migrations si applicable.

---

## Règles de tests

- Il n'y a pas encore de framework de test. **Ne pas annoncer qu'un test passe s'il n'existe pas.**
- Avant chaque commit, vérifier manuellement les flux critiques : génération → validation → publication.
- Quand un bug est corrigé, noter le scénario exact dans `docs/audits/technical-audit.md`.
- La commande de validation minimale avant commit est :
  ```bash
  npx tsc --noEmit && npm run lint
  ```

---

## Règles de documentation

- Documenter uniquement ce qui **existe réellement**. Ne pas décrire des fonctionnalités futures comme disponibles.
- Mettre à jour `docs/product/current-status.md` après chaque phase complétée.
- Enregistrer les décisions importantes dans `docs/product/decisions.md`.
- Les specs pour Codex vont dans `CODEX_SPECS/NNN-feature.md` (numérotées, séquentielles).
- `CLAUDE.md` est mis à jour si une règle change de façon permanente.

---

## Interdictions absolues

- **Ne jamais afficher les secrets** (API keys, tokens, mots de passe) dans les logs, l'UI ou les commits.
- **Ne jamais modifier `.env.local`** sans instruction explicite.
- **Ne jamais supprimer une fonctionnalité utile** sans preuve que personne ne l'utilise.
- **Ne jamais inventer une architecture** qui n'existe pas dans le code.
- **Ne jamais cacher une erreur de test** ou un échec de build.
- **Ne jamais contourner TypeScript avec `any`** sans commentaire justificatif.
- **Ne jamais ajouter une dépendance npm** sans vérifier qu'elle n'est pas déjà disponible.
- **Ne jamais annoncer que le projet est sécurisé** sans audit complet.
- **Ne jamais annoncer un gain de performance** sans mesure avant/après.
- **Ne jamais développer plusieurs gros modules simultanément** dans la même session.
- **Ne jamais casser la V1** pour accélérer la V2.
- **Ne jamais pusher sur `main`** sans accord explicite de Bradley.

---

## Format de rapport après chaque mission

```
## Analyse
[Ce qui a été analysé]

## Problèmes critiques
[Liste avec fichier + ligne]

## Problèmes importants
[Liste]

## Architecture documentée
[Ce qui a changé]

## Fichiers créés
[Liste]

## Fichiers modifiés
[Liste avec nature du changement]

## Tests exécutés
[Commandes lancées + résultats]

## Risques restants
[Ce qui n'a pas été traité]

## Prochaine phase recommandée
[Une seule phase, une seule priorité]
```

---

## Contexte technique rapide

- **Next.js 16.2.6** avec App Router. Lire `node_modules/next/dist/docs/` si doute sur une API.
- **Port dev : 3010** (pas 3000).
- **DB** : `./maestro.db` (LibSQL/SQLite local). Production : Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`).
- **Middleware auth** : `proxy.ts` à la racine (exporté comme middleware Next.js via Turbopack).
- **Cookie session** : `codexrs_session` (nom legacy, à mettre à jour).
- **URL publique** : `CODEXRS_PUBLIC_URL` requis en production pour que Meta accède aux images uploadées.
- **Pages legacy** (à supprimer en Phase 1) : `/dashboard`, `/models`, `/task-router`, `/token-economy`, `/work-memory`, `/resume-for-claude`, `/setup-guide`.
- **Vercel Cron** : `POST /api/cron/publish-due` — configuré dans `vercel.json`.
