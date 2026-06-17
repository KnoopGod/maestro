# Spec 062 — Export CSV : Filtres complets

## Objectif
La route `/api/posts/export` ignorait les filtres `q`, `platform` et `contentType`
introduits par les specs 054, 055 et 059. Le lien CSV dans la page Plan ne passait
aussi que `clientId` et `status`.

## Comportement

### Route API (`/api/posts/export`)
Accepter les paramètres : `clientId`, `status`, `q`, `platform`, `contentType`.
Les passer à `listPosts()` pour que le CSV reflète exactement la vue filtrée.

### Page Plan
Construire le lien CSV avec tous les filtres actifs :
`/api/posts/export?clientId=...&status=...&q=...&platform=...&contentType=...`

## Fichiers modifiés
- `app/api/posts/export/route.ts` — 3 nouveaux paramètres
- `app/plan/page.tsx` — lien CSV corrigé
