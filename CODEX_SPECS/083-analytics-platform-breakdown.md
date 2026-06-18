# Spec 083 — Analytics : Répartition par plateforme

## Objectif
Afficher dans la page analytics une répartition des posts publiés par plateforme (Instagram, Facebook, etc.), pour comprendre la distribution des contenus.

## Comportement

### Nouveau bloc "Posts par plateforme"
- Affiché après le bloc "Posts par pilier"
- Barre de progression horizontale par plateforme avec emoji et compteur
- Triées par nombre décroissant
- Masqué si aucun post publié

## Fichiers modifiés
- `app/analytics/page.tsx` — calcul platform breakdown + nouveau bloc JSX
