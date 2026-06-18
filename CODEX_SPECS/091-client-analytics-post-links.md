# Spec 091 — Analytics client : lien vers le détail des posts

## Objectif
Chaque ligne de post dans la page Analytics client comporte un lien "Détail →" vers la page de détail du post concerné.

## Comportement
- Lien "Détail →" aligné à droite dans l'en-tête de chaque `AnalyticsPostRow`
- Navigue vers `/posts/${id}?from=client`
- Le champ affiché privilégie `post.brief` quand disponible (plus lisible que la caption)

## Fichiers modifiés
- `app/clients/[id]/analytics/page.tsx` — `AnalyticsPostRow` : ajout du lien + priorité brief/caption
