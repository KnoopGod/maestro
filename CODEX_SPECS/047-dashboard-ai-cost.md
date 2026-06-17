# Spec 047 — Dashboard AI Cost Tracker

## Objectif
Afficher le coût IA total cumulé ce mois sur le dashboard pour suivre la consommation
et anticiper la facturation.

## Comportement

### KPI supplémentaire dans la grille Overview
- Remplace "ENGAGEMENT MOY." par "COÛT IA CE MOIS" (valeur peu fiable sans vrais insights)
- Format : `$0.0000` si < $0.01, `$X.XX` sinon
- Sous-label : `TOUS CLIENTS · CE MOIS`
- Couleur : emerald si coût < $5, amber si $5–$20, red si > $20

### Données
- Somme de `posts.cost` pour tous les posts créés depuis le 1er du mois (tous statuts)
- Requête dans `lib/db/queries/posts.ts` : `sumPostsCostThisMonth()`

## Fichiers modifiés
- `lib/db/queries/posts.ts` — ajout `sumPostsCostThisMonth()`
- `app/page.tsx` — ajout au Promise.all + affichage dans la grille Overview
