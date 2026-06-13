---
description: Checklist complète avant de merger une branche dans main ou de déclencher un déploiement Vercel.
---

# Release check — MAESTRO

Vérifie que la branche courante est prête à être mergée dans `main`.

## Étape 1 — Vérifications techniques automatiques

Lance dans l'ordre :

```bash
# TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Build complet
npm run build
```

**Si l'une échoue → STOP. Corriger avant de continuer.**

## Étape 2 — Vérification des secrets

```bash
# Vérifier qu'aucun secret n'est committé
git diff main... --name-only
```

Pour chaque fichier modifié :
- [ ] Pas de clé API dans le diff
- [ ] Pas de token dans le diff
- [ ] Pas de mot de passe dans le diff
- [ ] `.env.local` non inclus

## Étape 3 — Vérification des migrations DB

- [ ] Si un nouveau fichier dans `lib/db/migrations/` → est-il appelé dans `lib/db/schema.ts` `initSchema()` ?
- [ ] La migration est-elle idempotente (utilise `IF NOT EXISTS`, `catch(() => undefined)`) ?
- [ ] Le numéro de migration est-il séquentiel (dernier : 008) ?

## Étape 4 — Vérification de la documentation

- [ ] `docs/product/current-status.md` à jour
- [ ] `docs/product/decisions.md` mis à jour si nouvelles décisions
- [ ] `docs/audits/technical-audit.md` mis à jour si bug corrigé
- [ ] Nouveaux problèmes identifiés pendant le dev documentés

## Étape 5 — Vérification des variables d'environnement

- [ ] Si une nouvelle variable d'env est utilisée → documentée dans `docs/operations/environment.md`
- [ ] Si la variable est requise en prod → à configurer sur Vercel avant de merger

## Étape 6 — Test manuel du flux critique

Tester manuellement :
- [ ] Création d'un client ou sélection d'un client existant
- [ ] Génération d'un post dans le Studio
- [ ] Vérification que le post apparaît dans Validation
- [ ] Publication ou planification d'un post

## Étape 7 — Régressions évidentes

- [ ] La sidebar s'affiche correctement
- [ ] Le login fonctionne
- [ ] La page d'accueil charge sans erreur
- [ ] Pas d'erreur console dans les pages principales

## Résultat

Si tout est vert :
```
✅ Branche prête — peut être mergée dans main avec accord de Bradley
```

Si des problèmes existent :
```
❌ Bloquant : [liste]
⚠️ À documenter : [liste]
```
