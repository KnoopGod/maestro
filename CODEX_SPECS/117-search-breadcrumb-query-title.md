# Spec 117 — Post detail : titre breadcrumb enrichi avec la requête de recherche

## Objectif
Quand un post est ouvert depuis la page Recherche, le tooltip du breadcrumb "Recherche" affiche la requête utilisée, aidant l'utilisateur à confirmer ce à quoi il reviendra.

## Comportement

### Avant
- `title="Retour à la recherche"` quelle que soit la requête

### Après
- `title="Retour aux résultats pour «pizza»"` quand `searchBack` contient une requête
- `title="Retour à la recherche"` par défaut si pas de `searchBack`

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — case `fromCtx === 'search'` enrichi avec `title` dynamique
