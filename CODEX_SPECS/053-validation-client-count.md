# Spec 053 — Validation Client Filter Chips with Post Count

## Objectif
Afficher le nombre de posts en attente par client dans les chips de filtre de la page
de validation, pour prioriser rapidement les clients avec le plus de posts à valider.

## Comportement

### Format du chip
`{emoji} {name} ({count})` — ex : "🍕 La Pizza (3)"

### Données
Dérivées de `allQueue` déjà chargé — aucune requête supplémentaire.

## Fichiers modifiés
- `app/validation/page.tsx` — comptage par client et injection dans les chips
