# Spec 103 — Plan : compteurs stat boxes corrects avec filtre statut actif

## Objectif
Les stat boxes de la page Plan affichent des compteurs corrects même quand un filtre statut est actif.

## Comportement

### Avant
- Quand `status=published` est actif, les stat boxes "Planifiés", "Brouillons", "Échecs" affichent 0
- Les compteurs étaient calculés à partir de `posts` (déjà filtré par statut)

### Après
- Les stat boxes comptent toujours sur la base complète (sans filtre statut, mais avec les autres filtres actifs)
- Exemple : filtre `status=published` actif → la stat box "Planifiés" affiche le vrai nombre de posts planifiés
- Les autres filtres (client, plateforme, type de contenu, pilier, recherche) sont bien pris en compte dans les compteurs

## Implémentation

Ajout d'une 4e requête parallèle `countBaseList` qui récupère les posts sans le filtre statut mais avec tous les autres filtres actifs. La variable `statBase` est utilisée pour calculer tous les compteurs des stat boxes.

## Fichiers modifiés
- `app/plan/page.tsx`
