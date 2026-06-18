# Spec 111 — Recherche : conserver la requête dans le lien retour depuis le détail post

## Objectif
Quand l'utilisateur ouvre un post depuis la page Recherche, le lien retour dans le détail du post ramène aux mêmes résultats de recherche.

## Comportement

### Avant
- Les liens depuis `/search?q=pizza` vers `/posts/{id}` utilisaient `?from=search`
- Le breadcrumb "Recherche" renvoyait vers `/search` (sans requête — résultats vides)

### Après
- Les liens depuis la recherche encodent la requête dans `searchBack`
- Le breadcrumb "Recherche" reconstruit l'URL : `/search?q=pizza`
- Le paramètre `searchBack` est propagé lors de la navigation prev/next entre posts

## Fichiers modifiés
- `app/search/page.tsx` — lien post enrichi avec `&searchBack=<requête encodée>`
- `app/posts/[id]/page.tsx` — lecture de `searchBack`, `searchHref` calculé, propagé dans prev/next
