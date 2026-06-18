# Spec 105 — Post detail : contexte breadcrumb client-analytics

## Objectif
Quand l'utilisateur ouvre un post depuis la page Analytics d'un client, le lien retour dans le détail du post renvoie vers la page Analytics du client (et non vers la fiche principale).

## Comportement

### Avant
- Les liens depuis `/clients/{id}/analytics` vers `/posts/{id}` utilisaient `?from=client`
- Le breadcrumb affichait "[NomClient]" et renvoyait vers `/clients/{id}` (fiche principale)

### Après
- Les liens depuis `/clients/{id}/analytics` vers `/posts/{id}` utilisent `?from=client-analytics`
- Le breadcrumb affiche "Analytics · [NomClient]" et renvoie vers `/clients/{id}/analytics`

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — ajout de `'client-analytics'` dans `FromContext`, gestion du breadcrumb dynamique
- `app/clients/[id]/analytics/page.tsx` — `?from=client` remplacé par `?from=client-analytics`
