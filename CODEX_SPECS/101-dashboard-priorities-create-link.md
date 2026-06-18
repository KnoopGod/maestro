# Spec 101 — Dashboard priorités : "CRÉER →" ouvre le Studio avec client pré-sélectionné

## Objectif
Dans la section "Priorités du jour", le bouton "CRÉER →" navigue désormais directement vers le Studio avec le client pré-sélectionné, au lieu d'ouvrir la fiche client comme le reste de la carte.

## Comportement

### Avant
- La carte entière est un lien vers `/clients/{id}`
- "CRÉER →" est une étiquette sans lien séparé → ouvre la fiche client

### Après
- Corps de la carte (emoji + nom) → `/clients/{id}`
- Bouton "CRÉER →" → `/studio?client={id}`
- Structure `<div>` avec deux `<Link>` imbriqués distincts (pas de `<a>` dans `<a>`)

## Bonus
- `TodayScheduleWidget`: caption remplacé par `post.brief || post.caption` pour cohérence

## Fichiers modifiés
- `app/page.tsx` — section urgentClients dans les priorités du jour
- `components/dashboard/TodayScheduleWidget.tsx` — brief || caption
