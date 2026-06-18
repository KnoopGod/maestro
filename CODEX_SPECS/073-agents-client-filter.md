# Spec 073 — Agents : Filtre par client

## Objectif
Permettre de filtrer les jobs de la page Agents par client, pour voir
uniquement les générations d'un client spécifique.

## Comportement

### Paramètre URL
`/agents?client=<clientId>`

### Chips
Affichées en haut de la section Activité si ≥ 2 clients ont des jobs récents.
Format : `{emoji} {nom}`

### `listRecentJobs()`
Ajouter un paramètre `clientId?: string` — `WHERE client_id = ?` si présent.

### Impact
- Sections En cours / Erreurs / Aujourd'hui / Historique = filtrés
- Section Agents Registry et Cron = inchangées (globales)

## Fichiers modifiés
- `lib/db/queries/agent-jobs.ts` — param `clientId` dans `listRecentJobs()`
- `app/agents/page.tsx` — `?client=` param + chips client
