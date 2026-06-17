# Spec 039 — Per-client Upcoming Schedule Widget

## Objectif
Afficher les prochains posts planifiés directement sur la fiche client (`/clients/[id]`),
sans avoir à naviguer vers le calendrier ou le plan.

## Comportement

### Widget "Prochains posts planifiés"
- Inséré entre la section "Notes internes" et la section "Posts récents"
- Affiche jusqu'à **6 prochains posts** du client avec `status = 'scheduled'` et `scheduled_at > now`
- Triés par `scheduled_at ASC` (plus proche en premier)
- Si aucun post planifié : message vide + lien "Planifier maintenant →"

### Chaque ligne montre
- Emojis des plateformes (📷 Instagram, 👍 Facebook, etc.)
- Aperçu de la caption (60 chars tronqués)
- Date/heure formatée (ex : "mar. 18 juin à 10:00")
- Compte à rebours relatif : "Dans 2h30min" ou "Dans 3j"
- Lien vers `/plan?client=[id]`

### Header du widget
- Titre : "Prochains posts planifiés" + icône CalendarDays bleue
- Lien "Calendrier →" en haut à droite vers `/plan?client=[id]&status=scheduled`

## Architecture

### Nouvelle query — `lib/db/queries/posts.ts`
```typescript
export async function listClientUpcomingPosts(clientId: string, limit = 8): Promise<Post[]>
// SELECT WHERE client_id = ? AND status = 'scheduled' AND scheduled_at > NOW ORDER BY scheduled_at ASC
```

### Composant `UpcomingPostRow`
- Défini dans `app/clients/[id]/page.tsx` (server component)
- Reçoit `referenceTs` comme prop (calculé en dehors du composant pour éviter l'appel impure)

## Fichiers modifiés
- `lib/db/queries/posts.ts` — ajout `listClientUpcomingPosts()`
- `app/clients/[id]/page.tsx` — import + fetch + widget + composant `UpcomingPostRow`
