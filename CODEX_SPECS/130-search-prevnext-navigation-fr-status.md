# Spec 130 — Recherche : prev/next navigation et statuts en français

## Objectif
Les résultats de recherche manquaient de navigation prev/next entre posts, et les statuts étaient affichés en anglais.

## Comportement

### Avant
- Lien post search : `/posts/{id}?from=search&searchBack=...` — pas de prevId/nextId
- Statut affiché : `published`, `failed`, `scheduled` (anglais)
- Les boutons Préc./Suiv. du post detail n'apparaissaient jamais depuis la recherche

### Après
- Lien post search : `.../posts/{id}?from=search&searchBack=...&prevId=...&nextId=...` — navigation entre résultats
- Statuts en français : Publié, Échec, Planifié, Prêt, Brouillon
- Couleurs cohérentes avec le reste de l'application

## Fichiers modifiés
- `app/search/page.tsx` — `posts.map((p, i) => ...)` avec prevId/nextId, statuts traduits
