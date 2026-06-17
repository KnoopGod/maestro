# Spec 055 — Plan Platform Filter

## Objectif
Ajouter un filtre par plateforme (Instagram, Facebook, TikTok) dans la page Plan,
pour isoler rapidement le contenu d'une seule plateforme.

## Comportement

### Filtre URL
`/plan?platform=instagram` — paramètre optionnel ajouté au `searchParams`
Combinable avec `client`, `status` et `q`.

### Chips de filtre
Affichés dans la rangée de filtres existante, à droite des filtres de statut.
Chips : Instagram · Facebook · TikTok · LinkedIn (uniquement si des posts existent)

### Données
`listPosts()` reçoit un nouveau paramètre `platform` qui filtre avec `LIKE '%"platform"%'`
sur la colonne JSON `platforms`.

## Fichiers modifiés
- `lib/db/queries/posts.ts` — paramètre `platform` dans `listPosts()`
- `app/plan/page.tsx` — `searchParams.platform` + chips de filtre
