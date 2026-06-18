# Spec 096 — Client detail : "Tous les jobs" filtre par client

## Objectif
Dans la section "Activité agents" de la fiche client, le lien "Tous les jobs →" navigue désormais vers `/agents?client={id}` au lieu de `/agents` tout court.

## Comportement

### Avant
- Cliquer "Tous les jobs →" → `/agents` (non filtré, mélange tous les clients)

### Après
- Cliquer "Tous les jobs →" → `/agents?client={clientId}` (filtré sur ce client)

## Fichiers modifiés
- `app/clients/[id]/page.tsx` — lien "Tous les jobs →" dans la section Activité agents
