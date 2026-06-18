# Spec 084 — Analytics : Tendance mensuelle des publications

## Objectif
Afficher dans la page analytics la tendance mensuelle des posts publiés (6 derniers mois), pour visualiser la cadence de production.

## Comportement

### Nouveau bloc "Tendance mensuelle"
- Affiché en haut, juste après les statistiques globales
- Barre de progression horizontale par mois (du plus ancien au plus récent)
- Mois courant mis en évidence (couleur différente)
- Label format : "Jan 26", "Fév 26", etc.
- Masqué si moins de 2 mois de données

## Fichiers modifiés
- `app/analytics/page.tsx` — calcul monthly trend + nouveau bloc JSX
