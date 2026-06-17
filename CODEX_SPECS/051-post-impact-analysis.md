# Spec 051 — Post Impact Analysis Display

## Objectif
Afficher l'analyse d'impact (`impactAnalysis`) dans la page de détail d'un post.
Ce champ contient l'explication textuelle du score d'impact généré par le Supervisor.

## Comportement

### Emplacement
Dans le panneau "Métadonnées" de la sidebar, juste après "Impact score".

### Affichage
Si `post.impactAnalysis` est non nul :
- Expand/collapse avec un chevron (Server Component car contenu statique)
- Texte en prose xs, couleur gray-400, fond léger

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — affichage conditionnel de impactAnalysis dans MetaRow
