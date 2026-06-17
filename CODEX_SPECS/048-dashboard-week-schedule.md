# Spec 048 — Dashboard Week Schedule Widget

## Objectif
Remplacer le widget "PLANIFIÉ AUJOURD'HUI" par un widget "7 JOURS SUIVANTS" qui montre
tous les posts planifiés sur la semaine à venir groupés par jour.

## Comportement

### Données
- `listUpcomingPosts(7 * 24 * 60 * 60 * 1000)` — posts planifiés dans les 7 prochains jours

### Affichage
- Section heading : "PLANIFIÉ — 7 JOURS"
- Jours vides non affichés
- Pour chaque jour : en-tête `Aujourd'hui`, `Demain`, ou `Lun 23 Juin`
- Chaque post : heure · image/avatar · client · caption tronquée · lien Détail

### Empty state
- "Aucun post planifié cette semaine" + lien Studio

## Fichiers modifiés
- `app/page.tsx` — `listUpcomingPosts(7 * 24 * 60 * 60 * 1000)` + heading "7 JOURS"
- `components/dashboard/TodayScheduleWidget.tsx` → `WeekScheduleWidget` (même fichier, renommé en interne)
