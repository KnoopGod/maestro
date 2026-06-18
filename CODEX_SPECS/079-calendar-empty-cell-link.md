# Spec 079 — Calendrier : cellules vides cliquables

## Objectif
Dans la vue semaine du calendrier, rendre les cellules vides cliquables pour créer un post avec le client pré-sélectionné.

## Comportement

### Cellules vides
- Actuellement : affichent un tiret statique `—`
- Après : lien `href="/studio?client={clientId}"` avec un `+` discret au survol
- Cursor pointer, hover : montre un `+` gris clair en remplacement du tiret

## Fichiers modifiés
- `app/calendar/page.tsx` — remplacer le `<span>` statique par un `<Link>` avec hover effect
