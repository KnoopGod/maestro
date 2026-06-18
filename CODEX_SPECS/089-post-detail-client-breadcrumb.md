# Spec 089 — Post detail : breadcrumb retour client

## Objectif
Quand on arrive sur la page de détail d'un post depuis la fiche client (`?from=client`), le breadcrumb affiche "← NomDuClient" et renvoie vers la fiche client, au lieu du fallback générique "← Validation".

## Comportement

### Contexte `from=client`
- Breadcrumb label : nom du client (ex : "Le Petit Bistrot")
- Breadcrumb href : `/clients/:clientId`
- Breadcrumb title : `Retour à la fiche NomDuClient`

### Autres contextes
- Comportement inchangé (`validation`, `plan`, `calendar`, `dashboard`)

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — ajout de `'client'` dans `FromContext`, dérivation conditionnelle du breadcrumb
