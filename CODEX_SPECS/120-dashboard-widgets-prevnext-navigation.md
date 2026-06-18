# Spec 120 — Dashboard : navigation prev/next depuis les widgets d'alerte

## Objectif
Quand l'utilisateur ouvre un post depuis un widget du dashboard (posts en échec, posts en retard, planning du jour, retours portail), les boutons Précédent/Suivant dans le détail permettent de naviguer entre les posts de la même liste.

## Comportement

### Avant
- Tous les liens du dashboard passaient `from=dashboard` sans `prevId`/`nextId`
- Pas de navigation Précédent/Suivant pour les posts venant du dashboard

### Après
- `FailedPostsAlert` : prev/next entre posts en échec
- `OverduePostsAlert` : prev/next entre les posts en retard (sur la liste `posts`, pas seulement les 3 affichés)
- `TodayScheduleWidget` : prev/next entre tous les posts planifiés de la semaine (via index map)
- `PortalFeedbackAlert` : prev/next entre les posts avec retour portail (sur les 4 affichés)

## Fichiers modifiés
- `components/dashboard/FailedPostsAlert.tsx`
- `components/dashboard/OverduePostsAlert.tsx`
- `components/dashboard/TodayScheduleWidget.tsx`
- `components/dashboard/PortalFeedbackAlert.tsx`
