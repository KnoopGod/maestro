# Spec 032 — Pillar Coverage Widget

## Contexte

Une agence HORECA doit varier ses contenus selon les piliers stratégiques définis pour chaque client
(ex: "Ambiance", "Menu du jour", "Équipe", "Actualités"). Sans visibilité sur la répartition des
posts par pilier, certains thèmes sont sur-représentés et d'autres négligés.

## User Story

> En tant qu'agent HORECA, je veux voir sur la fiche client la distribution des posts par pilier
> sur les 30 derniers jours, pour identifier les piliers négligés et rééquilibrer la stratégie.

## Comportement

- Affiche une barre de progression par pilier avec le nombre de posts des 30 derniers jours
- Les piliers avec 0 posts sont signalés en ambre (⚠)
- Un badge "X négligé(s)" s'affiche si des piliers ont 0 posts
- Chaque pilier est cliquable → `/studio?client=X&pillar=Y` pour créer un post sur ce pilier
- Se base uniquement sur les posts avec `pillar IS NOT NULL` (assigné par le planner ou manuellement)

## Architecture

- `lib/db/queries/posts.ts` — `getPillarDistribution(clientId, withinMs)` export `PillarCount`
- `components/clients/PillarCoverageWidget.tsx` — composant Server (pas de 'use client')
- `app/clients/[id]/page.tsx` — remplace les chips piliers statiques, ajoute `getPillarDistribution()`
  dans `Promise.all`

## Fichiers

- `CODEX_SPECS/032-pillar-coverage-widget.md`
- `lib/db/queries/posts.ts` (modifié — export PillarCount + getPillarDistribution)
- `components/clients/PillarCoverageWidget.tsx` (nouveau)
- `app/clients/[id]/page.tsx` (modifié)
