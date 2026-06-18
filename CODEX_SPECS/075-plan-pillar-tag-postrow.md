# Spec 075 — Plan : Pilier et brief dans la ligne de post

## Objectif
Afficher le pilier de contenu et le brief dans chaque ligne du plan, pour améliorer la lisibilité sans navigation.

## Comportement

### Pilier (pillar badge)
- Affiché dans la bande de chips (statut, client, plateformes) en fin de ligne
- Badge violet cliquable → `/plan?pillar={pillar}` (sans préserver les autres filtres, cohérent avec le comportement du détail post)
- Masqué si `post.pillar` est vide ou null

### Brief comme sous-titre
- Si `post.brief` existe, l'afficher en sous-titre au-dessus de la caption (texte plus petit, gris clair)
- Permet d'identifier rapidement un post sans lire la caption complète
- Tronqué à 1 ligne

## Fichiers modifiés
- `app/plan/page.tsx` — ajout du badge pilier + sous-titre brief dans `PostRow`
