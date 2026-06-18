# Spec 093 — Calendrier : points cliquables dans la vue semaine

## Objectif
Les points colorés de la grille hebdomadaire du calendrier sont désormais cliquables et naviguent vers le plan filtré par client et statut.

## Comportement

### Avant
- Les points (publié, planifié, brouillon) étaient de simples `<span>` non interactifs

### Après
- Chaque point est un `<Link>` vers `/plan?client={clientId}&status={status}`
- Le titre du lien indique l'action : "Publié — voir dans le plan"
- Hover state adapté à chaque couleur de statut

## Implémentation
- `CALENDAR_DOT_CFG` : Record typé à la volée sur `'published' | 'scheduled' | 'draft'` (évite l'erreur TS7053 de Record<DayStatus>)
- `CalendarDot` : composant fonction défini au niveau module (pas dans le callback `map`)

## Fichiers modifiés
- `app/calendar/page.tsx` — ajout de `CALENDAR_DOT_CFG` et `CalendarDot`
