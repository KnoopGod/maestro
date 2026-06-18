# Spec 077 — Post detail : Navigation précédent/suivant

## Objectif
Ajouter des liens précédent / suivant dans le détail d'un post, pour naviguer dans la liste sans revenir à la page source.

## Comportement

### Transmission des IDs adjacents
Les pages sources (validation, plan) transmettent les IDs adjacents dans l'URL :
- `?prevId=abc&nextId=xyz` passés avec le lien vers le détail

### Affichage dans le détail
- Dans la barre de breadcrumb, après le lien de retour
- `← Précédent` (lien vers `/posts/{prevId}?from={context}&nextId={currentId}`)  
- `Suivant →` (lien vers `/posts/{nextId}?from={context}&prevId={currentId}`)
- Masqué si prevId/nextId absent

### Contexte préservé
Le `?from=` est transmis dans les liens prev/next pour que le breadcrumb reste cohérent.

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — lecture de `prevId`/`nextId` + affichage des liens
- `app/validation/page.tsx` — ajout de `prevId`/`nextId` dans les liens vers le détail
- `app/plan/page.tsx` — ajout de `prevId`/`nextId` dans les liens vers le détail
