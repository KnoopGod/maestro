# Spec 045 — Plan Month Groups

## Objectif
Grouper les posts du plan par mois pour une lecture calendaire plus naturelle.

## Comportement

### Groupes mensuels
- Posts séparés en sections "Juin 2026", "Mai 2026", etc. (mois décroissant)
- Chaque groupe affiche un en-tête avec : mois/année, compteur de posts, badge de statuts
- Section "Sans date" pour les posts sans `scheduled_at` ni `published_at`

### Ordre
- Groupes ordonnés par mois décroissant (le plus récent en premier)
- Dans chaque groupe : ordre existant (newest / oldest / impact selon le tri actif)

### Compteur dans l'en-tête
Format : `{n} post{s}` + petits badges colorés par statut (published, scheduled, draft, etc.)

## Fichiers modifiés
- `app/plan/page.tsx` — groupement par mois + rendu des en-têtes de groupe
