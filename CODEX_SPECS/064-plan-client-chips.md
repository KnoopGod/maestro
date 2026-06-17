# Spec 064 — Plan : Chips de sélection client

## Objectif
La page Plan n'affichait pas les chips de sélection de clients. On ne pouvait
que retirer le filtre actif, sans voir la liste des clients disponibles.
La page Validation dispose déjà de ces chips — aligner la Plan sur ce modèle.

## Comportement

### Affichage
Chips `{emoji} {nom} ({count})` visibles uniquement si plusieurs clients ont des posts
dans les résultats non filtrés.
Chip active : mise en évidence (border-purple-600/60, bg-purple-600/20).

### Données
Nombre de posts par client calculé sur la liste complète (sans filtre client)
pour que les counts restent cohérents quand on filtre.

### URL
`/plan?client=<clientId>` — same pattern as validation.
Supprimer le chip "Client : X ✕" actuel, remplacé par la chip active + ✕.

## Fichiers modifiés
- `app/plan/page.tsx` — counts par client + chips sélecteur
