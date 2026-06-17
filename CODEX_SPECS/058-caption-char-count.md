# Spec 058 — Caption Character Count

## Objectif
Afficher le nombre de caractères de la caption dans le panneau Caption de la page
de détail d'un post, avec indicateur coloré si les limites de plateformes sont approchées.

## Comportement

### Affichage
À droite du bouton Copier dans l'en-tête du panneau Caption.
Format : `{n} car.` — couleur grise normale, amber si > 2 000, rouge si > 2 200 (limite Instagram).

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — compteur dans le panneau Caption
