# Spec 085 — Analytics : Répartition par type de contenu

## Objectif
Afficher dans la page analytics la répartition des posts publiés par type (Photo, Reel, Story), pour comprendre la distribution du format de contenu.

## Comportement

### Nouveau bloc "Posts par type de contenu"
- Affiché après le bloc "Posts par plateforme"
- Barre de progression horizontale par type avec compteur
- Labels : photo → 🖼 Photo, reel → 🎬 Reel, story → 📱 Story
- Masqué si tous les posts sont du même type

## Fichiers modifiés
- `app/analytics/page.tsx` — calcul content type breakdown + nouveau bloc JSX
