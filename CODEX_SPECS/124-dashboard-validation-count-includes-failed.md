# Spec 124 — Dashboard : compteur "à valider" inclut les posts en échec

## Objectif
Aligner le compteur "À valider" du dashboard avec celui du badge sidebar — les deux doivent compter `draft + ready + failed`.

## Comportement

### Avant
- Dashboard : `countPostsByStatus(['draft', 'ready'])` — exclut les échecs
- Sidebar : `countPostsByStatus(['draft', 'ready', 'failed'])` — inclut les échecs
- Incohérence : le badge sidebar pouvait afficher 5 pendant que le dashboard affichait 3

### Après
- Dashboard et sidebar utilisent le même périmètre : `['draft', 'ready', 'failed']`

## Fichiers modifiés
- `app/page.tsx` — `countPostsByStatus(['draft', 'ready'])` → `['draft', 'ready', 'failed']`
