# Spec 113 — Validation : état vide contextuel pour tous les filtres actifs

## Objectif
Améliorer le message d'état vide de la page Validation pour distinguer "filtre actif sans résultat" vs "aucun post à valider".

## Comportement

### Avant
- Seul `clientFilter` était testé pour distinguer les messages
- `statusF` et `searchQuery` actifs affichaient le message générique "Aucun post en attente de validation"

### Après
- **Filtre actif (client, statut ou recherche) sans résultat** : "Aucun post ne correspond à ces filtres" + lien "Effacer les filtres" → `/validation`
- **Aucun post à valider** : "Aucun post en attente de validation" + CTA "Créer un post" → `/studio`

## Fichiers modifiés
- `app/validation/page.tsx` — condition étendue à `clientFilter || statusF || searchQuery`
