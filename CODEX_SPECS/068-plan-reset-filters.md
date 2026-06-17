# Spec 068 — Plan : Bouton "Réinitialiser les filtres"

## Objectif
Quand plusieurs filtres sont actifs simultanément sur la page Plan, ajouter
un bouton "Tout effacer" pour revenir à la vue complète en un clic.

## Comportement
- Affiché uniquement quand ≥ 2 filtres sont actifs (client, status, q, platform, type, pillar, sort≠newest)
- Lien vers `/plan` (sans paramètres)
- Texte : "✕ Effacer les filtres"
- Placé à la fin de la première ligne de filtres

## Fichiers modifiés
- `app/plan/page.tsx` — bouton conditionnel dans la zone de filtres
