# Spec 063 — Plan : Options de tri

## Objectif
Permettre de trier les posts du plan par date de création (défaut), score d'impact
ou date de planification, comme la page Validation.

## Comportement

### Paramètre URL
`/plan?sort=newest` (défaut) | `oldest` | `impact` | `scheduled`

### Chips de tri
Affichées dans la zone de filtres : "Récent · Ancien · Impact ↓ · Planifié"
La chip active est mise en évidence (border-purple-600).

### `listPosts()`
- `newest` → `created_at DESC`
- `oldest` → `created_at ASC`
- `impact` → `impact_score DESC`
- `scheduled` → `scheduled_at ASC` (postes sans date à la fin)

Note : `scheduled_at` n'est pas encore dans `orderBy` — l'ajouter.

## Fichiers modifiés
- `lib/db/queries/posts.ts` — ajouter `scheduled_at` au type `orderBy`
- `app/plan/page.tsx` — paramètre `sort` + chips de tri
