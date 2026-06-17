# Spec 034 — Pillar Selector in Studio

## Contexte

Le Studio génère des posts dont le pilier de contenu est déterminé automatiquement par l'Account
Director (basé sur les piliers récents du client). Les utilisateurs n'avaient aucun moyen de forcer
un pilier spécifique lors d'une génération manuelle — ce qui rendait difficile la création de
contenu ciblé sur un pilier en retard.

## User Story

> En tant qu'agent HORECA, je veux pouvoir choisir le pilier de contenu d'un post dans le Studio,
> pour générer intentionnellement du contenu sur le pilier qui manque dans ma stratégie.

## Comportement

- Entre BriefCard et PlatformsCard dans le Studio, des chips de piliers apparaissent si le client
  a des piliers définis dans sa stratégie
- Un pilier peut être sélectionné (toggle) ; aucune sélection = comportement auto (Account Director)
- Le pilier sélectionné est transmis à l'API `generate-post` via le champ `pillar`
- Dans `runPostPipeline()`, `userPillar` prend la priorité sur `account.directive.priorityPillar`
- Le pilier est pré-sélectionné si venant d'un `?pillar=` URL param, d'un post cloné ou chargé

## Architecture

- `lib/agents/pipeline.ts` — `userPillar?: string` dans input, override sur `priorityPillar`
- `app/api/studio/generate-post/route.ts` — lit `pillar` du body, le passe à `runPostPipeline`
- `components/studio/StudioForm.tsx` — `selectedPillar` state + chip selector UI

## Fichiers

- `CODEX_SPECS/034-studio-pillar-selector.md`
- `lib/agents/pipeline.ts` (modifié — userPillar param)
- `app/api/studio/generate-post/route.ts` (modifié — pillar parsing)
- `components/studio/StudioForm.tsx` (modifié — pillar state + UI chips)
