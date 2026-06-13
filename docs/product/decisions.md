# Décisions techniques et produit — MAESTRO

Ce fichier enregistre les décisions importantes pour éviter de les remettre en question à chaque session.

---

## Décisions produit

### DP-01 — Cible V1 : outil interne mono-utilisateur
**Date** : 2026-05  
**Décision** : MAESTRO V1 est un outil interne pour une agence, avec un seul administrateur. Pas de portail public, pas de multi-tenant, pas de facturation.  
**Raison** : Valider le workflow avant de construire la plateforme SaaS.  
**Impact** : Auth par mot de passe unique acceptable. Isolation des données non critique en V1.

### DP-02 — Validation humaine obligatoire avant publication
**Date** : 2026-05  
**Décision** : Même quand le Supervisor IA approuve un post (`verdict: ready`), une action humaine est requise pour publier.  
**Raison** : Les agents IA ne sont pas encore suffisamment fiables pour une publication entièrement autonome.  
**Impact** : L'auto-publication via cron ne publie que les posts `scheduled` (déjà validés par l'humain).

### DP-03 — Périmètre V1 : Facebook + Instagram uniquement
**Date** : 2026-05  
**Décision** : Seules les plateformes Meta (Facebook + Instagram) sont supportées en V1.  
**Raison** : L'API Meta est la plus complète pour le HORECA. TikTok et LinkedIn seront ajoutés en V2.  
**Impact** : `PostPlatform` type = `'instagram' | 'facebook' | 'tiktok' | 'linkedin'` (tiktok/linkedin en préparation).

---

## Décisions techniques

### DT-01 — LibSQL local + Turso production
**Date** : 2026-05  
**Décision** : SQLite via LibSQL en développement local (`./maestro.db`). Turso en production.  
**Raison** : Compatibilité totale LibSQL/Turso sans changement de code. Pas besoin de PostgreSQL.  
**Impact** : `DATABASE_URL=file:./maestro.db` par défaut. Turso activé via `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.

### DT-02 — Schéma auto-initialisé au premier usage
**Date** : 2026-05  
**Décision** : `lib/db/index.ts` initialise le schéma automatiquement avant la première requête (dev + local uniquement).  
**Raison** : Simplifier le démarrage sans commande manuelle.  
**Impact** : `CODEXRS_AUTO_INIT_SCHEMA=false` pour désactiver en production si besoin.

### DT-03 — Middleware auth dans `proxy.ts` (convention Turbopack)
**Date** : 2026-05  
**Décision** : Le middleware Next.js est dans `proxy.ts` à la racine (pas `middleware.ts`).  
**Raison** : Convention héritée de la configuration Turbopack initiale. Fonctionne correctement.  
**Risque** : Non standard — à renommer en `middleware.ts` dans la Phase 1 de stabilisation.

### DT-04 — Stockage images : local dev, Vercel Blob prod
**Date** : 2026-05  
**Décision** : `public/uploads/clients/<clientId>/` en local. Vercel Blob (`@vercel/blob`) en production.  
**Raison** : Le stockage local permet de développer sans compte Vercel. Blob est natif sur Vercel.  
**Impact** : `BLOB_READ_WRITE_TOKEN` requis en production. `CODEXRS_PUBLIC_URL` requis pour que Meta accède aux images.

### DT-05 — Génération de post synchrone (risque critique identifié)
**Date** : 2026-06 (audit Phase 0)  
**Décision** : Actuellement synchrone (HTTP bloquant). À rendre asynchrone en Phase 4.  
**Raison** : Implémentation simple pour la V1. Le timeout Vercel (60s) est le risque principal.  
**Plan** : Phase 4 — retourner un `jobId` immédiat, polling ou SSE pour le suivi.

### DT-06 — Tokens Meta en clair (risque critique identifié)
**Date** : 2026-06 (audit Phase 0)  
**Décision** : Tokens stockés en clair en V1. À chiffrer avant mise en production partagée.  
**Raison** : Implémentation rapide en V1 mono-utilisateur interne.  
**Plan** : Phase 3 — chiffrement AES-256-GCM avant toute ouverture d'accès externe.

### DT-07 — Pas de CSRF en V1
**Date** : 2026-06 (audit Phase 0)  
**Décision** : Pas de protection CSRF actuellement. `sameSite: lax` sur le cookie offre une protection partielle.  
**Risque** : Acceptable tant que l'outil est utilisé uniquement par l'administrateur sur son propre navigateur.  
**Plan** : À corriger avant tout partage d'accès (inviter des collaborateurs).

---

## Décisions d'architecture des agents

### DA-01 — Les agents ne touchent jamais la DB directement
**Date** : 2026-05  
**Décision** : Les agents reçoivent des données en entrée et retournent des données en sortie. C'est la route API ou le pipeline qui persiste.  
**Raison** : Séparation des responsabilités. Les agents sont testables indépendamment.

### DA-02 — Fallback regex pour le parsing JSON des agents Claude
**Date** : 2026-05  
**Décision** : Les réponses JSON de Claude sont parsées avec un try/catch + fallback regex (extraction du bloc JSON du markdown).  
**Raison** : Claude peut wrapper du JSON dans des blocs de code markdown. Le fallback évite les crashs.  
**Conserver** ce pattern pour tout nouvel agent.

### DA-03 — Supervisor non bloquant
**Date** : 2026-05  
**Décision** : Si le Supervisor échoue, le post est créé sans verdict plutôt que de faire échouer toute la génération.  
**Raison** : L'agent le plus important (le post en lui-même) ne doit pas être perdu si la supervision plante.

---

## Décisions UI

### DU-01 — Textes en français, code en anglais
**Date** : 2026-05  
**Décision** : Toute l'interface utilisateur est en français. Les variables, fonctions et commentaires techniques sont en anglais.  
**Raison** : Cible francophone (agences belges/françaises). Code anglais pour uniformité et compatibilité des outils.

### DU-02 — Design dark mode permanent
**Date** : 2026-05  
**Décision** : Interface dark mode uniquement (`dark` class sur `<html>`). Pas de toggle clair/sombre.  
**Raison** : Cohérence de l'identité visuelle MAESTRO. Simplifie le CSS (pas besoin de deux thèmes).
