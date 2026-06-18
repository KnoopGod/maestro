# Spec 112 — Calendrier : navigation prev/next entre posts depuis le détail

## Objectif
Quand l'utilisateur ouvre un post depuis la page Calendrier, les boutons Précédent/Suivant dans le détail permettent de naviguer entre les posts de la même liste (planifiés ou en préparation).

## Comportement

### Avant
- Les liens du calendrier passaient `from=calendar` et `calBack` mais pas `prevId`/`nextId`
- Pas de navigation Précédent/Suivant dans le détail pour les posts venant du calendrier

### Après
- Les liens du calendrier incluent `prevId` et `nextId` en plus de `calBack`
- Navigation prev/next disponible au sein de chaque section (Planifiés et En préparation séparément)

## Implémentation
Deux tables d'adjacence (`plannedAdj`, `inProgressAdj`) calculées dans `CalendarPage` via `buildAdjacency`.
`TimelineRow` reçoit `prevId?` et `nextId?` et les inclut dans le lien vers le détail.

## Fichiers modifiés
- `app/calendar/page.tsx` — `buildAdjacency` helper, `plannedAdj`/`inProgressAdj`, `TimelineRow` mis à jour
