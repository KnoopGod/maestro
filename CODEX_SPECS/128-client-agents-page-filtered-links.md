# Spec 128 — Client agents page : liens contextuels filtrés par client

## Objectif
Depuis la page agents d'un client (`/clients/[id]/agents`), les liens vers le Studio et l'activité agents doivent pré-filtrer sur le client courant.

## Comportement

### Avant
- Lien Studio : `/studio` (sans filtre client)
- Lien agents : `/agents` (sans filtre client) avec label générique "Voir tous les agents disponibles"

### Après
- Lien Studio : `/studio?client=${id}` — le client est pré-sélectionné
- Lien agents : `/agents?client=${id}` — l'activité est filtrée sur ce client, label "Voir l'activité agents pour {client.name}"

## Fichiers modifiés
- `app/clients/[id]/agents/page.tsx` — deux liens mis à jour avec filtre client
