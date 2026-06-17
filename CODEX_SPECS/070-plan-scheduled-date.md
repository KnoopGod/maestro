# Spec 070 — Plan : Affichage de la date de publication planifiée

## Objectif
Dans la ligne `PostRow` du Plan, afficher la date de planification pour les
posts `scheduled` plutôt que la date de création masquée dans le footer.

## Comportement

### Pour les posts `scheduled`
- Afficher `📅 {date planifiée}` en bleu dans la ligne de méta (footer)
- Si la date est dépassée : afficher un badge "En retard" en rouge
- La date de création reste visible mais en gris, moins visible

### Pour les autres statuts
Aucun changement — `createdAt` reste affiché comme actuellement.

## Fichiers modifiés
- `app/plan/page.tsx` — `PostRow` : date planifiée conditionnelle
