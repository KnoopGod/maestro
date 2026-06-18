# Spec 097 — Recherche : contexte breadcrumb "Recherche" dans le détail post

## Objectif
Les posts dans les résultats de la recherche utilisent désormais `?from=search`, ce qui affiche "← Recherche" dans le breadcrumb du détail de post au lieu de "← Plan".

## Comportement

### Avant
- Cliquer sur un post depuis la recherche → breadcrumb "← Plan"

### Après
- Cliquer sur un post depuis la recherche → breadcrumb "← Recherche" → `/search`

## Implémentation
- `FromContext` étendu : `'search'` ajouté
- `FROM_CFG` : entrée `search: { label: 'Recherche', href: '/search', title: 'Retour à la recherche' }`
- Tableau de validation `fromCtx` mis à jour

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — FromContext + FROM_CFG + validation array
- `app/search/page.tsx` — `?from=search` sur les liens post
