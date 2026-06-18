# Spec 132 — Export CSV : ajout du raisonnement et verdict supervisor

## Objectif
Enrichir l'export CSV avec deux colonnes utiles pour l'analyse interne : le verdict du supervisor et le raisonnement IA.

## Comportement

### Avant
- Colonnes CSV : id, client, statut, plateformes, type, pilier, brief, caption, hashtags, hook, cta, impact, coût, créé le, planifié le, publié le

### Après
- Colonnes CSV : id, client, statut, plateformes, type, pilier, brief, caption, hashtags, hook, cta, impact, **supervisor**, coût, créé le, planifié le, publié le, **raisonnement**
- `supervisor` : verdict et score, ex. `ready (87/100)` ou vide si non supervisé
- `raisonnement` : texte IA de la décision, utile pour affiner les briefs

## Fichiers modifiés
- `app/api/posts/export/route.ts` — deux colonnes ajoutées (headers + row mapping)
