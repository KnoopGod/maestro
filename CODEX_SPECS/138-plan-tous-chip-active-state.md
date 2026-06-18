# Spec 138 — Plan : chip "Tous" active uniquement quand aucun filtre actif

## Objectif
Le chip "Tous" dans la barre de filtres du plan s'affichait comme actif (surligné en violet) même quand un filtre plateforme, type ou pilier était actif. Seuls client, statut et recherche étaient pris en compte dans la condition d'activité.

## Comportement

### Avant
- Filtre plateforme "IG" actif → chip "Tous" s'affiche en violet (incorrect)
- Filtre pilier actif → chip "Tous" s'affiche en violet (incorrect)

### Après
- Chip "Tous" actif uniquement si aucun des 6 filtres n'est actif : client, statut, recherche, plateforme, type, pilier

## Fichiers modifiés
- `app/plan/page.tsx` — condition active du FilterChip "Tous" étendue à tous les filtres
