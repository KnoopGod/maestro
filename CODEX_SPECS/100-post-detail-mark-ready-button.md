# Spec 100 — Post detail : bouton "Marquer prêt" pour les brouillons

## Objectif
La page de détail d'un post en statut "Brouillon" affiche désormais un bouton "Marquer prêt" dans le panneau Actions, sans obliger l'utilisateur à retourner à la validation ou au plan.

## Comportement
- Visible uniquement quand `post.status === 'draft'`
- Positionné au-dessus des contrôles de planification
- Appelle `POST /api/posts/{id}/mark-ready`
- Après succès, passe le post en statut `ready` et rafraîchit la page

## Avant
- L'utilisateur devait naviguer vers /validation ou /plan pour marquer un brouillon comme prêt
- Le panneau "Actions" du détail de post ne proposait que planification et publication

## Après
- Toutes les actions clés (marquer prêt, planifier, publier) sont accessibles depuis la page de détail

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — import + utilisation de MarkReadyButton dans le sidebar Actions
