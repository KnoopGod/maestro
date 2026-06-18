# Spec 086 — Client detail : liens vers le détail des posts

## Objectif
Corriger les liens des posts dans la fiche client pour naviguer vers la page de détail du post, plutôt que vers des ancres obsolètes.

## Comportement

### Posts récents (`RecentPostRow`)
- Lien précédent : `/validation#${post.id}` (ancre, fragile)
- Lien corrigé : `/posts/${post.id}?from=client`

### Posts planifiés (`UpcomingPostRow`)
- Lien précédent : `/plan?client=${post.clientId}` (filtré sur le client, pas sur le post)
- Lien corrigé : `/posts/${post.id}?from=client`

## Fichiers modifiés
- `app/clients/[id]/page.tsx` — RecentPostRow + UpcomingPostRow
