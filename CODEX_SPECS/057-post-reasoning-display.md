# Spec 057 — Post Reasoning Display

## Objectif
Afficher le raisonnement IA (`reasoning`) dans la page de détail d'un post.
Ce champ contient l'explication de l'agent Account Director sur pourquoi il a choisi
cette approche de contenu.

## Comportement

### Emplacement
Dans la section "Brief original" de la colonne gauche, sous le brief, en collapse.

### Affichage
Si `post.reasoning` est non nul :
- Titre "Raisonnement IA" avec `<details>` expand/collapse
- Texte en prose xs, couleur gray-400, fond légèrement coloré (purple tint)

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — section Brief + Reasoning
