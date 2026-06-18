# Spec 122 — Export iCal : filtre client pris en compte

## Objectif
Quand l'utilisateur filtre le calendrier par client et exporte en iCal, l'export ne contient que les posts planifiés de ce client.

## Comportement

### Avant
- Le bouton iCal du calendrier pointait toujours vers `/api/posts/export/ical` sans filtre
- L'export incluait les posts de tous les clients même avec un filtre actif

### Après
- Si `clientFilter` est actif, l'URL devient `/api/posts/export/ical?clientId=<id>`
- Le titre du bouton reflète le périmètre de l'export

## Fichiers modifiés
- `app/calendar/page.tsx` — lien iCal mis à jour avec `clientFilter`
