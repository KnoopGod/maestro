# Spec 090 — Dashboard : alertes avec liens directs vers les posts

## Objectif
Les alertes du dashboard (posts en échec, retours portail) doivent rediriger directement vers la page de détail du post concerné, plutôt que vers des listes filtrées.

## Comportement

### FailedPostsAlert
- Lien "Voir →" précédent : `/plan?status=failed&client=${clientId}`
- Lien corrigé : `/posts/${id}?from=dashboard`

### PortalFeedbackAlert
- Lien précédent : `/validation` (non spécifique)
- Lien corrigé : `/posts/${id}?from=dashboard`

## Fichiers modifiés
- `components/dashboard/FailedPostsAlert.tsx`
- `components/dashboard/PortalFeedbackAlert.tsx`
