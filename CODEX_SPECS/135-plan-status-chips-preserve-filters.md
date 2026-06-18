# Spec 135 — Plan : chips de statut préservent les autres filtres actifs

## Objectif
Les chips de filtre par statut du plan (Planifiés, Publiés, Prêts, Brouillons, Échecs) utilisaient des hrefs statiques comme `/plan?status=scheduled`, écrasant tous les autres filtres actifs (client, recherche, plateforme, type, pilier, tri).

## Comportement

### Avant
- Filtre client "Bistro Le Coin" actif + clic "Planifiés" → `/plan?status=scheduled` (filtre client perdu)

### Après
- Filtre client "Bistro Le Coin" actif + clic "Planifiés" → `/plan?status=scheduled&client=xxx` (filtre client préservé)
- Clic sur un statut déjà actif le désactive (toggle) tout en préservant les autres filtres
- Seul "Tous" remet à zéro l'ensemble des filtres (comportement voulu)

## Fichiers modifiés
- `app/plan/page.tsx` — FilterChips de statut utilisent désormais `planUrl({ status: ... })` au lieu de hrefs statiques
