# Spec 067 — Plan : Filtre par pilier de contenu

## Objectif
Permettre de filtrer les posts du plan par pilier de contenu (ex. "Promo",
"Engagement", "Info") pour comparer la couverture de chaque thématique.

## Comportement

### Paramètre URL
`/plan?pillar=Promo`

### Chips
Affichées uniquement si plusieurs piliers sont présents dans les résultats.
Format : "{pilier}" — valeur exacte du champ `pillar`.

### `listPosts()`
Ajouter un paramètre `pillar?: string` avec `pillar = ?` dans le WHERE.

### `planUrl()`
Inclure `pillar` dans les overrides préservés.

## Fichiers modifiés
- `lib/db/queries/posts.ts` — paramètre `pillar` dans `listPosts()`
- `app/plan/page.tsx` — `searchParams.pillar` + chips de pilier
