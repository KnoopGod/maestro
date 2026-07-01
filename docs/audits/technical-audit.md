# Audit technique — MAESTRO

Date de l'audit initial : 2026-06-13
Dernière revue : 2026-07-01 (code et configuration de production vérifiés)
Réalisé par : Claude Code

---

## Résumé

| Gravité | Nombre | Traité |
|---|---|---|
| Critique | 4 | 1 résolu, 3 acceptés en V1 (mono-admin) |
| Important | 8 | 7 résolus, 1 sans objet (décision changée) |
| Amélioration | 8 | 5 résolues, 1 partielle, 2 ouvertes |

---

## Problèmes critiques

### C1 — Génération de post synchrone (risque timeout)
**Statut** : ✅ Résolu (Phase 4).
**Fichier** : `app/api/studio/generate-post/route.ts`
**Vérifié** : la route retourne un `jobId` immédiatement et exécute le pipeline en arrière-plan (`after()` + polling). Le risque de timeout Vercel 60s est levé.

### C2 — Tokens Meta historiques en clair dans la DB
**Statut** : ⚠️ Partiellement résolu — chiffrement actif en production.
**Fichier** : `lib/crypto/tokens.ts`, `lib/db/queries/social-accounts.ts`
**Vérifié** : le chiffrement AES-256-GCM (PBKDF2 par client) est implémenté et actif dès que `MAESTRO_ENCRYPTION_KEY` est défini ; sans clé, warning explicite + stockage en clair (comportement documenté, pas un bug).
**Vérifié en production** : `MAESTRO_ENCRYPTION_KEY` est active. Les anciens
comptes créés avant son activation doivent être reconnectés pour garantir la
migration de leurs tokens en clair.

### C3 — Protection CSRF partielle
**Statut** : Accepté en V1 (DT-07) — pas de régression, pas de progrès.
**Fichiers** : `proxy.ts` (toutes les routes POST/PATCH/DELETE)
**Vérifié** : validation `Origin` + cookie `sameSite=strict` toujours en place. Pas de token CSRF dédié.
**Plan** : reste bloquant pour le portail multi-utilisateur (V2), pas pour le mono-admin actuel.

### C4 — Auth mono-mot de passe sans révocation
**Statut** : Accepté en V1 (DP-01) — inchangé.
**Fichier** : `lib/auth/session.ts`
**Vérifié** : pas de table `sessions`, toujours un token dérivé du mot de passe sans révocation individuelle.
**Plan** : Phase V2 (SaaS) — table `sessions` avec expiration et révocation.

---

## Problèmes importants

### I1 — StudioForm.tsx trop volumineux
**Statut** : ✅ Résolu (Phase 2).
**Vérifié** : `components/studio/StudioForm.tsx` fait maintenant 463 lignes (contre 1 335), découpé en sous-composants dans `components/studio/`.

### I2 — 7 pages legacy accessibles
**Statut** : ✅ Résolu (Phase 1).
**Vérifié** : `app/dashboard/`, `app/models/`, `app/task-router/`, `app/token-economy/`, `app/work-memory/`, `app/resume-for-claude/`, `app/setup-guide/` n'existent plus.

### I3 — `proxy.ts` non standard
**Statut** : Sans objet — décision produit changée (voir CLAUDE.md, DT-03).
**Précision** : `proxy.ts` est en fait le nom **correct** pour le middleware dans Next.js 16.2.6 (Turbopack) ; `middleware.ts` y est déprécié. Ne pas renommer.

### I4 — `types/index.ts` mélange types legacy et MAESTRO
**Statut** : ✅ Résolu (Phase 1).
**Vérifié** : `types/index.ts` n'existe plus ; les types legacy (`AIProvider`, `Task`, `WorkSession`, `Mode`) ont été supprimés avec les pages associées.

### I5 — Package `ollama` inutile en production
**Statut** : ✅ Résolu (Phase 1).
**Vérifié** : `app/api/ollama/`, `app/api/router/`, `app/api/status/` n'existent plus ; dépendance absente de `package.json`.

### I6 — `@base-ui/react` installé mais usage inconnu
**Statut** : ✅ Résolu — usage confirmé, pas de code mort.
**Vérifié** : `@base-ui/react` est la fondation de plusieurs composants `components/ui/*` (badge, button, dialog, progress, select, switch, tabs, tooltip). Coexistence avec `shadcn/ui` intentionnelle (shadcn génère des wrappers au-dessus de base-ui).

### I7 — `README.md` par défaut create-next-app
**Statut** : ✅ Corrigé (Phase 0).

### I8 — Pas de headers de sécurité HTTP
**Statut** : ✅ Résolu (Phase 6).
**Vérifié** : `next.config.ts` définit CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, et HSTS en production. Headers `no-referrer` + `noindex` dédiés sur `/portal/:token*`.

---

## Améliorations

| Ref | Description | Statut | Priorité |
|---|---|---|---|
| A1 | Aucun framework de test | Ouvert | V2 |
| A2 | Pas de table de tracking des migrations exécutées | Partiel — migrations numérotées et idempotentes dans `lib/db/migrations/` (002 à 010+), mais aucune table ne journalise lesquelles ont tourné | Faible |
| A3 | `framer-motion` potentiellement sous-utilisé | Ouvert — toujours utilisé dans seulement 2 fichiers | Faible |
| A4 | `lib/mode-config.ts` : code mort | ✅ Résolu (Phase 1) | — |
| A5 | `store/useCommandCenterStore.ts` : code mort | ✅ Résolu (Phase 1) | — |
| A6 | Cookie session nommé `codexrs_session` (nom legacy) | Ouvert — toujours en place, renommage différé en V2 | V2 |
| A7 | `next.config.ts` vide — pas d'optimisation image | ✅ Résolu (Phase 6) — `images.remotePatterns` configuré | — |
| A8 | `SESSION_HANDOFF.md`, `AGENTS.md` à la racine | Partiel — `AGENTS.md` est un fichier de règles Next.js légitime (à garder) ; `SESSION_HANDOFF.md` est daté du 28 mai 2026 et obsolète par rapport à `docs/product/current-status.md` | Faible |

---

## Historique des corrections

| Date | Problème | Action |
|---|---|---|
| 2026-06-13 | README.md par défaut | Réécrit (Phase 0) |
| 2026-06-13 | CLAUDE.md branding CODEXRS | Mis à jour (Phase 0) |
| 2026-06-13 | DB incompatible (ancien schéma) | Réinitialisée + seed |
| 2026-06-30 | Audit technique obsolète (Phases 1–6 non reflétées) | Revue complète ligne par ligne contre le code réel ; statuts corrigés |
