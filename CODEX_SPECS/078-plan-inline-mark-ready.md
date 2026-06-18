# Spec 078 — Plan : Bouton "Marquer Prêt" dans la ligne de post

## Objectif
Permettre de marquer un post comme prêt directement depuis la liste du plan, sans naviguer vers la page de détail.

## Comportement

### Bouton "Marquer Prêt"
- Affiché dans le footer de `PostRow` uniquement si `post.status === 'draft'`
- Utilise le composant `MarkReadyButton` existant (même que validation)
- Placé à côté des liens Détail / Dupliquer dans le footer du post

## Fichiers modifiés
- `app/plan/page.tsx` — import + affichage conditionnel de `MarkReadyButton` dans `PostRow`
