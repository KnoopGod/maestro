# Spec 050 — Plan Month Anchor Navigation

## Objectif
Ajouter une barre de navigation par mois en haut du plan (quand les groupes existent)
pour sauter directement à un mois sans scroller.

## Comportement

### Barre de navigation
- Affichée uniquement si > 1 groupe mois
- Chips cliquables (ancre #month-YYYY-MM)
- Mois courant mis en évidence si présent dans les résultats
- Placement : entre les filtres et la liste

### Ancres
Chaque en-tête de groupe reçoit un `id="month-YYYY-MM"` (clé normalisée).

## Fichiers modifiés
- `app/plan/page.tsx` — ajout `id` sur les en-têtes de groupe + barre d'ancres
