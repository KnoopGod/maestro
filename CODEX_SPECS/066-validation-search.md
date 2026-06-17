# Spec 066 — Validation : Recherche textuelle

## Objectif
Ajouter une recherche par texte dans la file de validation (caption, brief)
pour retrouver rapidement un post dans une longue file.

## Comportement

### Paramètre URL
`/validation?q=...` — même pattern que la page Plan.

### Composant
Réutiliser `PlanSearchInput` en ajoutant une prop `basePath` (défaut : `/plan`).
La page Validation passe `basePath="/validation"`.

### Filtre DB
`q` est passé à `listPosts()` — déjà supporté par le WHERE.

## Fichiers modifiés
- `components/plan/PlanSearchInput.tsx` — prop `basePath` optionnelle
- `app/validation/page.tsx` — param `q` + `<PlanSearchInput basePath="/validation" />`
