# Spec 106 — Calendrier : conserver la semaine et le filtre client au retour depuis le détail post

## Objectif
Quand l'utilisateur ouvre un post depuis le calendrier (vue semaine précédente ou avec filtre client), le lien retour dans le détail du post ramène à la même semaine et au même filtre.

## Comportement

### Avant
- Les liens depuis le calendrier vers `/posts/{id}` utilisaient `?from=calendar`
- Le breadcrumb "Calendrier" renvoyait toujours vers `/calendar` (semaine courante, sans filtre)

### Après
- Les liens depuis le calendrier vers `/posts/{id}` passent les paramètres actifs encodés dans `calBack`
  - Exemple : semaine -2 avec filtre client → `?from=calendar&calBack=week%3D-2%26client%3DaBC`
- Le breadcrumb "Calendrier" reconstruit l'URL complète : `/calendar?week=-2&client=aBC`
- Le paramètre `calBack` est propagé lors de la navigation prev/next entre posts

## Fichiers modifiés
- `app/calendar/page.tsx` — `TimelineRow` reçoit `weekOffset` et `clientFilter`, génère `calBack` dans le lien
- `app/posts/[id]/page.tsx` — lit `calBack`, construit l'URL calendrier, propage via prev/next
