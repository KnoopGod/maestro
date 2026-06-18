# Spec 102 — Dashboard OverduePostsAlert : liens individuels vers les posts

## Objectif
L'alerte "posts en retard de publication" affiche désormais jusqu'à 3 posts individuels cliquables, chacun avec un lien direct vers la page de détail du post.

## Comportement

### Avant
- L'alerte affichait uniquement le nombre total et des liens vers le Calendrier et le Plan

### Après
- Affiche jusqu'à 3 posts en retard avec :
  - Label "Xh de retard" ou "Xj de retard"
  - Titre du post (brief ou caption)
  - Lien direct vers `/posts/{id}?from=dashboard`
- Si plus de 3 posts, affiche "+N autres"
- Les liens vers le Calendrier et le Plan restent en bas

## Fichiers modifiés
- `components/dashboard/OverduePostsAlert.tsx`
