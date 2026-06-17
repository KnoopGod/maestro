# Spec 061 — Calendar Week Navigation

## Objectif
Permettre la navigation entre les semaines sur la page Calendrier, et corriger les
liens des posts qui pointaient vers `/validation#id` au lieu de `/posts/id`.

## Comportement

### Paramètre URL
`/calendar?week=N` — entier relatif à la semaine courante (0 = cette semaine, -1 = semaine précédente, +1 = semaine suivante).
Valeur par défaut : 0.

### Boutons de navigation
- `←` précédent : `?week=N-1`
- `→` suivant : `?week=N+1`
- `Aujourd'hui` : retour à `?week=0`, visible uniquement si `week !== 0`

### Titre dynamique
La plage de dates (lundi – dimanche) reflète la semaine affichée.

### Liens des posts
`TimelineRow` : href → `/posts/${post.id}` (non `/validation#${post.id}`).

## Fichiers modifiés
- `app/calendar/page.tsx` — paramètre `week` + navigation + correction liens
