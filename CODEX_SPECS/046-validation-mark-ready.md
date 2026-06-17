# Spec 046 — Validation Mark Ready Button

## Objectif
Permettre de passer un post de `draft` à `ready` d'un seul clic dans la validation
sans passer par le BulkActionBar ni ouvrir le détail.

## Comportement

### Bouton "Marquer prêt"
- Visible uniquement si `post.status === 'draft'`
- Clic → `PATCH /api/posts/{id}` avec `{ status: 'ready' }`
- Après succès : `router.refresh()`
- Pendant l'action : spinner + bouton désactivé
- Erreur : message inline rouge

### Placement
Dans la rangée de boutons du PostCard de validation (à côté de Supprimer et Copier).

## Fichiers modifiés
- `app/validation/page.tsx` — nouveau composant `MarkReadyButton` + insertion dans PostCard
