# Spec 129 — Plan : compteur Total exact (pas limité à 100)

## Objectif
Le StatBox "Total" du plan affichait `posts.length` qui était plafonné à 100 (la limite de fetch des posts affichés). Quand le nombre de posts dépasse 100, le compteur était faux.

## Comportement

### Avant
- `StatBox label="Total" value={posts.length}` — plafonné à 100
- Exemple : 150 posts → affiche "100"

### Après
- `countPosts()` query dédiée sans limit, avec les mêmes filtres actifs
- `StatBox label="Total" value={statusFilter ? statBase.length : totalPostsCount}`
- Quand un filtre de statut est actif, `statBase.length` est correct car il contient tous les statuts
- Sans filtre de statut, `totalPostsCount` donne le vrai nombre

## Implémentation
- Ajout de `countPosts(options)` dans `lib/db/queries/posts.ts` — même logique de filtres que `listPosts` mais `SELECT COUNT(*)` sans LIMIT
- Import et appel dans `app/plan/page.tsx`

## Fichiers modifiés
- `lib/db/queries/posts.ts` — nouvelle fonction `countPosts`
- `app/plan/page.tsx` — import `countPosts`, ajout dans `Promise.all`, utilisation dans StatBox Total
