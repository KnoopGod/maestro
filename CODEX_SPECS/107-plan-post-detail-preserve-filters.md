# Spec 107 — Plan : conserver tous les filtres actifs dans le lien retour depuis le détail post

## Objectif
Quand l'utilisateur ouvre un post depuis le plan avec des filtres actifs (client, statut, plateforme, type, pilier, recherche, tri), le lien retour dans le détail du post ramène au plan avec exactement les mêmes filtres.

## Comportement

### Avant
- Les liens depuis `/plan?client=X&status=published` vers `/posts/{id}` utilisaient `?from=plan`
- Le breadcrumb "Plan" renvoyait vers `/plan` (sans aucun filtre)

### Après
- Les liens depuis le plan vers le détail d'un post encodent l'état des filtres actifs dans `planBack`
- Le breadcrumb "Plan" reconstruit l'URL complète : `/plan?client=X&status=published`
- Le paramètre `planBack` est propagé lors de la navigation prev/next entre posts

## Implémentation

Les filtres actifs sont encodés dans `activePlanStr` (URLSearchParams string) dans `PlanPage`,
passés via prop `activePlanStr` à `MonthGroupedPosts`, puis inclus dans `detailHref` calculé
pour chaque `PostRow`.

## Fichiers modifiés
- `app/plan/page.tsx` — `activePlanStr` calculé dans `PlanPage`, passé à `MonthGroupedPosts`, `detailHref` calculé dans le map callback
- `app/posts/[id]/page.tsx` — lecture de `planBack`, reconstruction de l'URL plan
