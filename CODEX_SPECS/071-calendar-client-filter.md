# Spec 071 — Calendrier : Filtre client

## Objectif
Quand plusieurs clients sont actifs, le calendrier montre une grille dense.
Ajouter un filtre client par chips pour n'afficher que les posts d'un client.

## Comportement

### Paramètre URL
`/calendar?client=<clientId>` — même pattern que Plan et Validation.

### Chips
Affichées sous l'entête si ≥ 2 clients actifs.
Format : `{emoji} {nom}`
Chip active : border-purple-600/60.

### Filtrage
- La grille semaine ne montre que les lignes du client actif
- Les sections "Planifiés" et "En préparation" filtrent aussi par client

### Stats
Les 3 stat boxes restent globales (non filtrées) pour garder le contexte.

## Fichiers modifiés
- `app/calendar/page.tsx` — param `client` + chips + filtrage
