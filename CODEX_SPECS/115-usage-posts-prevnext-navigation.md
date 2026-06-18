# Spec 115 — Usage : navigation prev/next entre posts depuis l'activité récente

## Objectif
Quand l'utilisateur ouvre un post depuis la section "Activité récente" de la page Usage, les boutons Précédent/Suivant dans le détail permettent de naviguer entre les posts de la même liste.

## Comportement

### Avant
- Les liens passaient `from=usage` sans `prevId`/`nextId`
- Pas de navigation Précédent/Suivant dans le détail pour les posts venant de la page Usage

### Après
- Les liens incluent `prevId` et `nextId` calculés depuis l'index dans la liste
- Navigation prev/next disponible parmi les posts de l'activité récente

## Fichiers modifiés
- `app/usage/page.tsx` — `stats.recentPosts.map` enrichi avec index pour prev/next
