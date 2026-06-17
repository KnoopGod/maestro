# Spec 035 — Bulk Quick Schedule

## Contexte

Le BulkActionBar de /validation permettait déjà de "Marquer prêts", "Remettre en brouillon" et
"Supprimer" des posts en masse. Il manquait la planification en lot : après avoir généré 5 posts
en batch, l'agent devait ouvrir chaque post individuellement pour le planifier.

## User Story

> En tant qu'agent HORECA, je veux pouvoir sélectionner plusieurs posts dans /validation et les
> planifier en un clic sur un créneau commun (demain 10h, 12h, 19h ou date personnalisée).

## Comportement

- Bouton "Planifier" dans le BulkActionBar quand des posts non-publiés sont sélectionnés
- Clic → panel de planification rapide : Demain 10h / 12h / 19h + date personnalisée
- Si plusieurs posts : espacés de 10 minutes (ex: 3 posts → 10h00, 10h10, 10h20)
- L'API `/api/posts/bulk` accepte `action: 'schedule'` + `scheduledAts: number[]`
- Après planification : désélection + router.refresh()

## Architecture

- `app/api/posts/bulk/route.ts` — ajout de l'action `schedule` avec `scheduledAts: number[]`
- `components/posts/BulkActions.tsx` — bouton "Planifier" + panel inline avec présets + datetime custom

## Fichiers

- `CODEX_SPECS/035-bulk-schedule.md`
- `app/api/posts/bulk/route.ts` (modifié)
- `components/posts/BulkActions.tsx` (modifié)
