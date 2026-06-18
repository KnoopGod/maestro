# Spec 076 — Plan : Badge type de contenu dans la ligne de post

## Objectif
Afficher le type de contenu (Post / Reel / Story / Vidéo) dans chaque ligne du plan, pour permettre un scan visuel rapide sans filtrer.

## Comportement

### Badge type de contenu
- Affiché dans la bande de chips (statut, client, plateformes, pilier)
- Badge indigo cliquable → `/plan?type={contentType}` (sans préserver les autres filtres)
- Masqué si `post.contentType === 'post'` (type par défaut, déjà implicite)
- Labels : `post → Post`, `reel → Reel`, `story → Story`, `video → Vidéo`

## Fichiers modifiés
- `app/plan/page.tsx` — ajout du badge contentType dans `PostRow`
