# Spec 088 — Usage : activité récente cliquable

## Objectif
Rendre les lignes d'activité récente dans la page Usage cliquables, avec un lien vers la page de détail du post correspondant.

## Comportement
- Chaque ligne de la section "Activité récente" est un `<Link>` vers `/posts/${id}`
- Hover léger pour indiquer l'interactivité (déjà présent, converti en Link)

## Fichiers modifiés
- `app/usage/page.tsx` — `<div>` → `<Link>` dans la boucle recentPosts
