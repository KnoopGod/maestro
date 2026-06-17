# Spec 041 — Validation Queue Filters & Sort

## Objectif
Permettre de filtrer la file de validation par client et de trier par date ou impact,
sans JavaScript côté client (navigation par URL).

## Comportement

### Filtre client
- Chips de client affichés au-dessus de la liste quand ≥2 clients ont des posts en attente
- "Tous" désélectionne le filtre
- Chip actif = fond violet, chip inactif = bordure grise
- URL param : `?client=<clientId>`

### Tri
- "Récent" (défaut) : `created_at DESC`
- "Ancien" : `created_at ASC`
- "Impact ↓" : `impact_score DESC` (les meilleurs posts en premier)
- URL param : `?sort=oldest|impact` (absent = newest)

### Banner filtre actif
- Quand un client est sélectionné : affiche le nom du client, le nombre de posts filtrés, et un bouton ✕ pour désactiver

### EmptyState contextuel
- Quand le filtre client est actif et qu'il n'y a pas de posts : "Aucun post en attente pour [client]"

## Architecture

### `lib/db/queries/posts.ts`
- Ajout de `orderDir?: 'ASC' | 'DESC'` à `listPosts()`
- Extension de `orderBy` pour accepter `'impact_score'`

### `app/validation/page.tsx`
- Accepte `searchParams: { client?: string; sort?: string }`
- Passe `orderBy`, `orderDir`, `clientId` à `listPosts()`
- Render chips client et boutons tri via `Link` (zéro JS)
- `buildUrl()` helper pour construire les URLs filtrées

## Fichiers modifiés
- `lib/db/queries/posts.ts` (orderDir + impact_score orderBy)
- `app/validation/page.tsx` (searchParams + filtres + tri)
