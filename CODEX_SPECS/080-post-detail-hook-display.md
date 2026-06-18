# Spec 080 — Post detail : affichage du prompt image

## Objectif
Afficher le prompt d'image (utilisé pour générer le visuel) dans la section Métadonnées du post, utile pour comprendre et reproduire le style visuel.

## Comportement

### Affichage
- Affiché dans la section "Métadonnées" du post, sous le champ "Impact score"
- Label "Prompt image" en petites majuscules gris
- Contenu du prompt en `<details>` pliable (masqué par défaut, texte long)
- Masqué si `post.imagePrompt` est null ou vide

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — ajout du bloc imagePrompt dans la section Métadonnées
