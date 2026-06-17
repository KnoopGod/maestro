# Spec 060 — Agents Page Cost Summary

## Objectif
Afficher le coût IA cumulé des derniers jobs sur la page Agents, pour avoir
une visibilité immédiate de la consommation IA sans aller sur la page Usage.

## Comportement

### Widget dans les stats de la page Agents
Ajout d'un KPI "Coût cumulé" dans la grille de stats en haut de la page,
à côté de Total / En cours / Terminés / Erreurs.

### Données
Somme de `cost` des jobs récents déjà chargés — aucune requête supplémentaire.

## Fichiers modifiés
- `app/agents/page.tsx` — calcul du coût total + affichage dans la grille stats
