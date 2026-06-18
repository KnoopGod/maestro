# Spec 121 — Export CSV : filtre pilier pris en compte

## Objectif
Quand l'utilisateur filtre le plan par pilier et exporte en CSV, l'export respecte le filtre pilier.

## Comportement

### Avant
- Le bouton CSV du plan incluait clientId, status, q, platform, contentType — mais pas `pillar`
- L'API `/api/posts/export` ne lisait pas `pillar`

### Après
- Le pillar est inclus dans l'URL d'export : `?pillar=recette`
- L'API lit le param `pillar` et le passe à `listPosts`
- L'export CSV respecte ainsi tous les filtres actifs du plan

## Fichiers modifiés
- `app/plan/page.tsx` — `pillarFilter` ajouté dans l'URL d'export CSV
- `app/api/posts/export/route.ts` — lecture du param `pillar` et passage à `listPosts`
