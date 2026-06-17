# Spec 052 — Plan Stats Boxes as Clickable Filters

## Objectif
Rendre les 5 StatBox du plan page cliquables pour filtrer directement par statut.

## Comportement

- "Total" → `/plan` (enlève tous les filtres)
- "Publiés" → `/plan?status=published`
- "Planifiés" → `/plan?status=scheduled`
- "Brouillons" → `/plan?status=draft`
- "Échecs" → `/plan?status=failed`
- StatBox active (correspond au filtre courant) : bordure plus visible

## Fichiers modifiés
- `app/plan/page.tsx` — StatBox reçoit `href` optionnel + `active` booléen
