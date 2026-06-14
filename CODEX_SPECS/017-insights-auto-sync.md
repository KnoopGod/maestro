# Spec 017 — Synchronisation automatique des Meta Insights

**Date** : 2026-06-14
**Priorité** : Haute (alimente analytics + portail client)
**Dépend de** : performance-analyst.ts, posts.meta_insights, cron vercel.json

---

## Contexte

Les insights Meta (reach, likes, comments, shares, saves) sont disponibles sur l'API Meta
environ 24h après publication. Actuellement ils sont mis à jour manuellement post par post.

Cette spec ajoute une route cron `POST /api/cron/sync-insights` appelée toutes les 6h,
qui boucle sur les posts publiés depuis moins de 30 jours et rafraîchit leurs insights.

---

## Périmètre

### Fichiers à créer
- `app/api/cron/sync-insights/route.ts`

### Fichiers à modifier
- `vercel.json` — ajouter le cron toutes les 6h

---

## Implémentation

Algorithme :
1. Lister tous les posts `published` dans les 30 derniers jours
2. Pour chaque post avec `metaPostIds.facebook` ou `metaPostIds.instagram` :
   - Appeler `fetchFacebookInsights` / `fetchInstagramInsights`
   - Sauvegarder via `savePostInsights`
3. Retourner un rapport `{ synced, skipped, errors }`

Limites :
- 30 posts max par run (évite les timeouts Vercel)
- Prioriser les posts sans insights ou dont les insights ont été mis à jour > 12h

---

## Sécurité

La route est protégée par le header `Authorization: Bearer {CRON_SECRET}` (standard Vercel Cron).
`CRON_SECRET` est un env var optionnel — si absent, la route n'est accessible que depuis Vercel.
