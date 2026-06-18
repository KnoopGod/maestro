# Spec 087 — Clients : filtre par statut

## Objectif
Ajouter un filtre par statut (Actif / Pause / Archivé) sur la page clients, en plus du filtre type existant.

## Comportement

### Filtre statut
- URL param `?status=active|paused|archived`
- Affiché sous le filtre type, seulement si plusieurs statuts coexistent
- Combinable avec le filtre type (les deux params coexistent dans l'URL)
- Label "Tous" remet le statut à `all` tout en conservant le filtre type actif

### Compteurs
- Chaque chip affiche le nombre de clients correspondant au statut (non filtré par type)

## Fichiers modifiés
- `app/clients/page.tsx` — lecture du param `status`, passage à `ClientGridWithFilters`
- `components/clients/ClientFilters.tsx` — prop `statusFilter`, chips UI, filtre useMemo
