# Spec 059 — Plan Content Type Filter

## Objectif
Filtrer les posts du plan par type de contenu (Post, Reel, Story) pour
faciliter la recherche dans des plans contenant des formats mixtes.

## Comportement

### Filtre URL
`/plan?type=reel` — paramètre `type` dans searchParams.

### Chips
Affichés uniquement si plusieurs types sont présents dans les résultats actuels.
Format : "Post · Reel · Story"

### Implémentation
`listPosts()` accepte déjà `content_type` dans le WHERE — vérifier.
Si non, ajouter le paramètre `contentType`.

## Fichiers modifiés
- `lib/db/queries/posts.ts` — paramètre `contentType` dans `listPosts()`
- `app/plan/page.tsx` — `searchParams.type` + chips
