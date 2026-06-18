# Spec 110 — Agents : état vide contextuel selon filtre client

## Objectif
Améliorer le message d'état vide de la page Agents pour distinguer "aucun job car filtre client actif" vs "aucun job enregistré du tout".

## Comportement

### Avant
- "Aucune activité enregistrée" affiché même quand un filtre client actif ne retourne rien

### Après
- **Filtre client actif sans résultat** : "Aucun job pour [nom client]" + CTA "Voir tous les jobs" → `/agents`
- **Aucun job dans la base** : "Aucune activité enregistrée" + CTA "Créer un post" → `/studio`

## Fichiers modifiés
- `app/agents/page.tsx` — `filteredClient` calculé, empty state conditionnel selon `clientFilter`
