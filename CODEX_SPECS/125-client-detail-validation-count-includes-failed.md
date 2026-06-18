# Spec 125 — Client detail : compteur "En validation" inclut les posts en échec

## Objectif
Aligner le compteur "En validation" de la fiche client avec la file de validation réelle (draft + ready + failed).

## Comportement

### Avant
- `draftCount = clientPosts.filter(draft || ready)` — exclut les échecs
- La stat "En validation" pouvait être en dessous du nombre réel de posts à traiter

### Après
- `draftCount = clientPosts.filter(draft || ready || failed)` — cohérent avec la validation queue
- Le lien `/validation?client=xxx` affiche tous les posts concernés

## Fichiers modifiés
- `app/clients/[id]/page.tsx` — filtre `draftCount` étendu à `failed`
