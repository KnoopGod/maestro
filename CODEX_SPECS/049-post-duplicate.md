# Spec 049 — Post Duplication

## Objectif
Permettre de dupliquer un post existant en tant que nouveau brouillon, pour réutiliser
le contenu sur un autre créneau ou pour créer des variations d'un post performant.

## Comportement

### Route API
`POST /api/posts/[id]/duplicate`
- Crée un nouveau post avec : même client, plateformes, caption, hashtags, hook, cta,
  brief, pillar, imageUrl, imageAssetId
- Status: `draft`, scheduled_at: null, meta_post_ids: {}, published_at: null
- Nouvel ID généré (`nanoid(12)`)
- Retourne `{ post: newPost }`

### Bouton dans PostRow (plan)
- Texte : "Dupliquer"
- Placement : rangée de métadonnées en bas du PostRow, à côté de "Réutiliser"
- Navigation après succès : `/posts/{newId}` (le détail du nouveau post)
- Pendant l'action : spinner

### Bouton dans la page de détail
- Section "Liens rapides" : lien "Dupliquer ce post"
- Navigation après succès : `/posts/{newId}`

## Fichiers créés / modifiés
- `app/api/posts/[id]/duplicate/route.ts` (créé)
- `components/posts/DuplicatePostButton.tsx` (créé)
- `app/plan/page.tsx` — bouton dans PostRow
- `app/posts/[id]/page.tsx` — bouton dans la sidebar (liens rapides)
