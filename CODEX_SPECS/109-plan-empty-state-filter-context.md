# Spec 109 — Plan : état vide contextuel selon filtres actifs

## Objectif
Améliorer le message d'état vide de la page Plan pour distinguer deux situations : aucun post existe du tout, ou les filtres actifs ne correspondent à aucun post.

## Comportement

### Avant
- Affichage d'un message générique "Aucun post pour le moment." quelle que soit la cause

### Après
- **Filtres actifs sans résultat** : "Aucun post ne correspond à ces filtres." + lien "Effacer les filtres →" vers `/plan`
- **Aucun post dans la base** : "Aucun post pour le moment." + lien "Créer le premier post" vers `/studio`

## Logique
La condition vérifie si au moins un filtre est actif : `clientFilter || statusFilter || searchQuery || platformFilter || typeFilter || pillarFilter`.

## Fichiers modifiés
- `app/plan/page.tsx` — bloc `posts.length === 0` remplacé par un conditionnel contextualisé
