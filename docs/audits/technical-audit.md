# Audit technique — MAESTRO

Date de l'audit : 2026-06-13
Réalisé par : Claude Code (session `maestro-project-handoff`)

---

## Résumé

| Gravité | Nombre | Traité |
|---|---|---|
| Critique | 4 | 0 |
| Important | 8 | 0 |
| Amélioration | 8 | 0 |

---

## Problèmes critiques

### C1 — Génération de post synchrone (risque timeout)
**Fichier** : `app/api/studio/generate-post/route.ts`
**Problème** : Le pipeline complet (4 agents + image) s'exécute dans la requête HTTP. Durée : 30-90s. Vercel coupe à 60s.
**Impact** : Timeout silencieux — le post peut être créé partiellement sans que le client reçoive de réponse.
**Plan** : Phase 4 — retourner `jobId` immédiatement, pipeline en arrière-plan.

### C2 — Tokens Meta historiques en clair dans la DB
**Fichier** : `lib/db/schema.ts` — table `client_social_accounts`
**Problème** : les nouveaux tokens sont chiffrés si `MAESTRO_ENCRYPTION_KEY` existe, mais les anciens tokens restent en clair jusqu'à reconnexion/migration.
**Impact** : si la base fuit avant migration/reconnexion, les anciens comptes Meta restent exposés.
**Plan** : définir `MAESTRO_ENCRYPTION_KEY` en prod puis reconnecter/migrer les comptes.

### C3 — Protection CSRF partielle
**Fichiers** : Toutes les routes POST/PATCH/DELETE
**Problème** : `sameSite=strict` + validation `Origin` couvrent les mutations navigateur, mais il n'y a pas encore de token CSRF dédié.
**Impact** : risque fortement réduit en mono-admin, à renforcer avant portail multi-utilisateur.
**Plan** : token CSRF dédié ou double-submit cookie en V2.

### C4 — Auth mono-mot de passe sans révocation
**Fichier** : `lib/auth/session.ts`
**Problème** : Token permanent dérivé du mot de passe. Pas de révocation individuelle.
**Impact** : Acceptable en V1 mono-user. Bloquant pour tout partage d'accès.
**Plan** : Phase 7 (SaaS) — table `sessions` avec expiration et révocation.

---

## Problèmes importants

### I1 — StudioForm.tsx de 1 335 lignes
**Fichier** : `components/studio/StudioForm.tsx`
**Problème** : Un seul composant gère 8 responsabilités distinctes.
**Plan** : Phase 2 — découpage en sous-composants.

### I2 — 7 pages legacy accessibles
**Fichiers** : `app/dashboard/`, `app/models/`, `app/task-router/`, `app/token-economy/`, `app/work-memory/`, `app/resume-for-claude/`, `app/setup-guide/`
**Problème** : Code mort de l'ancienne version. Toujours compilé et accessible via URL.
**Plan** : Phase 1 — suppression.

### I3 — `proxy.ts` non standard
**Fichier** : `proxy.ts`
**Problème** : Next.js attend `middleware.ts`. Fonctionne via Turbopack mais fragile.
**Plan** : Phase 1 — renommer en `middleware.ts`.

### I4 — `types/index.ts` mélange types legacy et MAESTRO
**Fichier** : `types/index.ts`
**Problème** : Types `AIProvider`, `Task`, `WorkSession`, `Mode` ne sont utilisés que par les pages legacy.
**Plan** : Phase 1 — nettoyer avec les pages legacy.

### I5 — Package `ollama` inutile en production
**Fichiers** : `package.json`, `app/api/ollama/route.ts`
**Problème** : 500KB dans le bundle. Route API inutilisée.
**Plan** : Phase 1 — supprimer.

### I6 — `@base-ui/react` installé mais usage inconnu
**Fichier** : `package.json`
**Problème** : Deux bibliothèques UI coexistent (`@base-ui/react` + `shadcn/ui`).
**Plan** : Phase 1 — identifier et supprimer si inutilisé.

### I7 — `README.md` par défaut create-next-app
**Fichier** : `README.md`
**Problème** : Zéro information sur MAESTRO.
**Statut** : ✅ Corrigé en Phase 0.

### I8 — Pas de headers de sécurité HTTP
**Fichier** : `next.config.ts`
**Problème** : Pas de CSP, X-Frame-Options, HSTS.
**Plan** : Phase 6.

---

## Améliorations

| Ref | Description | Fichier | Priorité |
|---|---|---|---|
| A1 | Aucun framework de test | — | Phase 8 |
| A2 | Pas de table de versioning migrations | `lib/db/schema.ts` | Faible |
| A3 | `framer-motion` potentiellement sous-utilisé | `package.json` | Faible |
| A4 | `lib/mode-config.ts` : code mort | `lib/mode-config.ts` | Phase 1 |
| A5 | `store/useCommandCenterStore.ts` : code mort | `store/` | Phase 1 |
| A6 | Cookie session nommé `codexrs_session` (nom legacy) | `lib/auth/session.ts` | Phase 3 |
| A7 | `next.config.ts` vide — pas d'optimisation image | `next.config.ts` | Phase 6 |
| A8 | `SESSION_HANDOFF.md`, `AGENTS.md` à la racine | racine | Phase 1 |

---

## Historique des corrections

| Date | Problème | Action |
|---|---|---|
| 2026-06-13 | README.md par défaut | Réécrit (Phase 0) |
| 2026-06-13 | CLAUDE.md branding CODEXRS | Mis à jour (Phase 0) |
| 2026-06-13 | DB incompatible (ancien schéma) | Réinitialisée + seed |
