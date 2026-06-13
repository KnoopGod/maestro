# Déploiement — MAESTRO sur Vercel

## Prérequis

- Compte Vercel lié à GitHub `KnoopGod/maestro`
- Base Turso créée et configurée
- Variables d'environnement configurées dans Vercel Dashboard

## Déploiement automatique

Vercel déploie automatiquement depuis la branche `main` à chaque push.  
Les branches de feature génèrent une Preview URL.

## Processus de déploiement manuel

```bash
# 1. Vérifier que tout est propre
npx tsc --noEmit && npm run lint && npm run build

# 2. Merger dans main (uniquement après accord de Bradley)
git checkout main
git merge <branche-feature>
git push origin main

# Vercel déploie automatiquement
```

## Vérifications avant de merger dans main

- [ ] `npx tsc --noEmit` — pas d'erreur TypeScript
- [ ] `npm run lint` — pas d'erreur ESLint
- [ ] `npm run build` — build réussit
- [ ] Flux critique testé manuellement : génération → validation → publication
- [ ] Pas de secret committé
- [ ] Migrations DB compatibles avec la prod
- [ ] `docs/product/current-status.md` mis à jour

## Cron

Vercel Cron est configuré dans `vercel.json` :
```json
{
  "crons": [{ "path": "/api/cron/publish-due", "schedule": "0 8 * * *" }]
}
```

Publication automatique des posts schedulés chaque jour à 08h00 UTC.  
`CRON_SECRET` doit être configuré pour que Vercel puisse authentifier l'appel.

## Stockage des médias en production

Vercel Blob est utilisé pour les assets uploadés en production.  
`BLOB_READ_WRITE_TOKEN` requis.  
`CODEXRS_PUBLIC_URL` doit pointer vers le domaine de production pour que Meta accède aux images.

## Logs de production

Accessibles dans Vercel Dashboard → Functions → Logs.  
En cas d'erreur de publication Meta, vérifier les logs de `/api/studio/publish-post`.
