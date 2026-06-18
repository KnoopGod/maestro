# Spec 092 — Plan : stat boxes préservent les filtres actifs

## Objectif
Quand un filtre (client, recherche, pilier, plateforme) est actif dans le plan, cliquer sur une stat box (Publiés, Planifiés, etc.) doit conserver les filtres en cours et seulement changer le filtre statut.

## Comportement

### Avant
- Cliquer "Publiés" avec `?client=X` actif → `/plan?status=published` (client perdu)

### Après
- Cliquer "Publiés" avec `?client=X` actif → `/plan?client=X&status=published`
- "Total" réinitialise uniquement le statut, pas les autres filtres

## Implémentation
Les hrefs des stat boxes utilisent désormais `planUrl({ status: ... })` au lieu d'URLs hardcodées.

## Fichiers modifiés
- `app/plan/page.tsx` — stat boxes
