# Spec 094 — Calendrier : nom client → lien vers la fiche

## Objectif
Dans la grille hebdomadaire du calendrier, les noms de clients sont désormais cliquables et naviguent vers la fiche client.

## Comportement

### Avant
- Le nom et l'emoji du client dans la colonne gauche de la grille étaient de simples `<span>` non interactifs

### Après
- Chaque cellule client est un `<Link href="/clients/{id}">` avec un titre contextuel
- Hover : légère diminution d'opacité pour indiquer l'interactivité

## Fichiers modifiés
- `app/calendar/page.tsx` — cellule client de la grille hebdomadaire
