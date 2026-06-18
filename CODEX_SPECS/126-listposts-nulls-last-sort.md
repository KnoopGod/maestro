# Spec 126 — listPosts : NULLS LAST pour le tri par colonnes nullables

## Objectif
Corriger le tri des posts par `scheduled_at` et `impact_score` : les posts sans valeur (NULL) doivent apparaître en dernier, pas en premier.

## Comportement

### Avant
- `ORDER BY scheduled_at ASC` → les posts sans date planifiée (NULL) apparaissaient AVANT les posts planifiés
- `ORDER BY impact_score DESC` → les posts sans score (NULL) apparaissaient AVANT les posts avec un score

### Après
- Tri enrichi : `scheduled_at IS NULL, scheduled_at ASC` → NULL en dernier
- Tri enrichi : `impact_score IS NULL, impact_score DESC` → NULL en dernier

## Implémentation
SQLite traite NULL comme la plus petite valeur en ORDER BY ASC.
La clause `col IS NULL` évalue à 0 (faux) pour une vraie valeur et à 1 (vrai) pour NULL.
En ajoutant `col IS NULL` comme premier critère ASC, les NULL sont repoussés à la fin.

## Fichiers modifiés
- `lib/db/queries/posts.ts` — `orderClause` construit différemment pour `scheduled_at` et `impact_score`
