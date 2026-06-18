# Spec 108 — Validation : conserver les filtres actifs dans le lien retour depuis le détail post

## Objectif
Quand l'utilisateur ouvre un post depuis la page Validation avec des filtres actifs (client, statut, recherche, tri), le lien retour dans le détail du post ramène à la validation avec exactement les mêmes filtres.

## Comportement

### Avant
- Les liens depuis `/validation?status=draft` vers `/posts/{id}` utilisaient `?from=validation`
- Le breadcrumb "Validation" renvoyait vers `/validation` (sans filtre)

### Après
- Les liens depuis la validation vers le détail d'un post encodent l'état des filtres actifs dans `validationBack`
- Le breadcrumb "Validation" reconstruit l'URL complète : `/validation?status=draft`
- Le paramètre `validationBack` est propagé lors de la navigation prev/next entre posts

## Fichiers modifiés
- `app/validation/page.tsx` — `activeValidationStr` calculé, passé à `PostCard`, inclus dans le lien détail
- `app/posts/[id]/page.tsx` — lecture de `validationBack`, reconstruction de l'URL validation
