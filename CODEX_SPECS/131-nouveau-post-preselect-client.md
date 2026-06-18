# Spec 131 — "Nouveau post" pré-sélectionne le client filtré

## Objectif
Quand un filtre client est actif sur le plan ou la validation, le bouton "Nouveau post" doit ouvrir le Studio avec ce client déjà sélectionné.

## Comportement

### Avant
- Bouton "Nouveau post" : toujours `/studio`
- L'utilisateur doit re-sélectionner manuellement le client

### Après
- Bouton "Nouveau post" (plan) : `/studio?client=${clientFilter}` si filtre actif
- Bouton "Nouveau post" (validation) : `/studio?client=${clientFilter}` si filtre actif
- Sans filtre actif : `/studio` (comportement inchangé)

## Fichiers modifiés
- `app/plan/page.tsx` — href conditionnel du bouton "Nouveau post"
- `app/validation/page.tsx` — href conditionnel du bouton "Nouveau post"
