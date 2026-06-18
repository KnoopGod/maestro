# Spec 081 — Portail client : navigation par mois

## Objectif
Le portail client supporte déjà le paramètre `?month=YYYY-MM` mais n'affiche aucun bouton de navigation. Ajouter des flèches ← → pour changer de mois.

## Comportement

### Navigation mois
- Boutons ← / → à côté du label du mois dans le header du portail
- Liens `?month=YYYY-MM` calculés côté serveur (mois précédent et suivant)
- Le mois futur (au-delà du mois courant) est désactivé (pas de lien)
- Le mois courant est le défaut (URL propre sans paramètre)

## Fichiers modifiés
- `app/portal/[token]/page.tsx` — calcul prev/next month + liens de navigation
