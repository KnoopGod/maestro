# Spec 123 — Clients : lien effacer le filtre dans l'état vide filtré

## Objectif
Quand les filtres actifs (type ou statut) ne retournent aucun client, ajouter un lien "Voir tous les clients →" pour aider l'utilisateur à effacer les filtres.

## Comportement

### Avant
- Affichage de "Aucun client dans cette catégorie." sans action possible

### Après
- "Aucun client dans cette catégorie." + lien "Voir tous les clients →" vers `/clients`

## Fichiers modifiés
- `components/clients/ClientFilters.tsx` — lien ajouté dans le bloc `filtered.length === 0`
