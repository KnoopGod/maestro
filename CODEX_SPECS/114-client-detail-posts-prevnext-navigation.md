# Spec 114 — Client : navigation prev/next entre posts depuis la fiche client

## Objectif
Quand l'utilisateur ouvre un post depuis la fiche client (sections "Posts récents" et "Prochaines publications"), les boutons Précédent/Suivant dans le détail permettent de naviguer entre les posts de la même liste.

## Comportement

### Avant
- Les liens depuis la fiche client passaient `from=client` sans `prevId`/`nextId`
- Pas de navigation Précédent/Suivant dans le détail pour les posts venant de la fiche client

### Après
- `RecentPostRow` et `UpcomingPostRow` reçoivent `prevId?` et `nextId?`
- Les liens incluent ces paramètres quand disponibles
- Navigation prev/next disponible au sein de chaque liste (récents et planifiés séparément)

## Fichiers modifiés
- `app/clients/[id]/page.tsx` — `RecentPostRow` et `UpcomingPostRow` mis à jour avec `prevId?`/`nextId?`
