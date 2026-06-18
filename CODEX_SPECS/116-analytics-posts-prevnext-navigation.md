# Spec 116 — Analytics client : navigation prev/next entre posts

## Objectif
Quand l'utilisateur ouvre un post depuis la page Analytics d'un client, les boutons Précédent/Suivant dans le détail permettent de naviguer entre les posts publiés de ce client.

## Comportement

### Avant
- Les liens passaient `from=client-analytics` sans `prevId`/`nextId`
- Pas de navigation Précédent/Suivant dans le détail pour les posts venant des analytics

### Après
- `AnalyticsPostRow` reçoit `prevId?` et `nextId?`
- Les liens incluent ces paramètres pour activer la navigation

## Fichiers modifiés
- `app/clients/[id]/analytics/page.tsx` — `AnalyticsPostRow` mis à jour avec `prevId?`/`nextId?`
