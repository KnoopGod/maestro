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

### C2 — Tokens Meta en clair dans la DB
**Fichier** : `lib/db/schema.ts` — table `client_social_accounts`  
**Problème** : `access_token` et `refresh_token` stockés sans chiffrement.  
**Impact** : Si `maestro.db` fuite, tous les comptes Meta clients sont compromis.  
**Plan** : Phase 3 — chiffrement AES-256-GCM.

### C3 — Pas de protection CSRF
**Fichiers** : Toutes les routes POST/PATCH/DELETE  
**Problème** : L'auth repose uniquement sur le cookie (sameSite: lax). Pas de token CSRF.  
**Impact** : Attaque CSRF possible si l'admin visite un site malveillant pendant sa session.  
**Plan** : Phase 3 — header `X-Requested-With` ou token CSRF.

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
| 2026-06-13 | 7 pages legacy | Supprimées (Phase 1) |
| 2026-06-13 | `proxy.ts` non standard | Renommé `middleware.ts` (Phase 1) |
| 2026-06-13 | Package ollama + routes API legacy | Supprimés (Phase 1) |
| 2026-06-13 | `lib/mock-data/`, `lib/mode-config.ts`, store | Supprimés (Phase 1) |
