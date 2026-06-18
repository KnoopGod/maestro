# Spec 136 — Plan : tags pilier et type préservent les filtres actifs

## Objectif
Dans les PostRow du plan, les tags cliquables (pilier, type de contenu) utilisaient des hrefs statiques comme `/plan?pillar=xxx`, perdant tous les autres filtres actifs (client, statut, recherche, plateforme, tri).

## Comportement

### Avant
- Clic sur tag pilier : `/plan?pillar=Gastronomie` (filtre client perdu)
- Clic sur tag type : `/plan?type=carousel` (filtre statut perdu)

### Après
- Clic sur tag pilier : `planUrl({ pillar: 'Gastronomie' })` → ex. `/plan?client=xxx&status=published&pillar=Gastronomie`
- Clic sur tag type : `planUrl({ type: 'carousel' })` → tous les autres filtres préservés

## Implémentation
- `planUrl` passé en prop via `MonthGroupedPosts` → `PostRow`
- Type prop : `(overrides: Record<string, string | undefined>) => string`

## Fichiers modifiés
- `app/plan/page.tsx` — `planUrl` propagé dans MonthGroupedPosts et PostRow, tags mis à jour
