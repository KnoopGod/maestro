# Spec 095 — Validation : stat boxes filtrent par statut

## Objectif
Les stat boxes (Brouillons, Prêts, Échecs) de la page Validation sont désormais cliquables pour filtrer la file par statut. Cliquer à nouveau retire le filtre.

## Comportement

### Avant
- Les boxes affichaient les compteurs mais n'étaient pas interactives

### Après
- Cliquer "Brouillons" → `/validation?status=draft`
- Cliquer "Prêts" → `/validation?status=ready`
- Cliquer "Échecs" → `/validation?status=failed`
- Cliquer une box active → retire le filtre statut (toggle)
- Le filtre client et la recherche sont préservés lors du basculement statut
- Les compteurs dans les boxes montrent toujours le total non filtré

## Implémentation
- `searchParams` étendu : `{ client?, sort?, q?, status? }`
- `statusF` : statut validé parmi `['draft', 'ready', 'failed']`
- `baseQueue` : toujours les 3 statuts (pour les compteurs corrects)
- `queue` : filtré par `statusF` si actif
- `StatBox` : props `href` + `active` (comme dans Plan)

## Fichiers modifiés
- `app/validation/page.tsx` — searchParams, filtrage, StatBox
