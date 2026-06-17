# Spec 030 — Failed Posts Alert (Dashboard)

## Contexte

Quand un post planifié échoue à la publication (supervisor blocked, token expiré, erreur Meta),
le statut passe à `failed` mais l'utilisateur doit aller sur /plan et filtrer par "failed" pour le
constater. Ce silence opérationnel est un risque : des publications peuvent échouer sans que
personne ne le sache pendant des heures.

## User Story

> En tant qu'agent HORECA, je veux voir immédiatement sur le dashboard si une publication a
> échoué dans les dernières 48h, avec le nom du client et un résumé de l'erreur, pour pouvoir
> réagir rapidement.

## Comportement

- Bannière rouge sur le dashboard si des posts sont en statut `failed` depuis moins de 48h
- Affiche : nom du client, plateformes visées, début de l'erreur, heure relative
- Lien "Voir →" vers `/plan?status=failed&client=<id>`
- Si aucun post failed récent : aucun composant rendu (null)

## Architecture

- `lib/db/queries/posts.ts` — `listRecentlyFailedPosts(withinMs = 48h)` avec JOIN clients
  - Retourne `FailedPostSummary[]` (type léger : id, clientId, clientName, error, platforms, updatedAt)
- `components/dashboard/FailedPostsAlert.tsx` — composant Server (pas de 'use client')
- `app/page.tsx` — intégré dans Promise.all, affiché sous TokenExpiryBanner

## Fichiers

- `CODEX_SPECS/030-failed-posts-alert.md`
- `lib/db/queries/posts.ts` (modifié — export FailedPostSummary + listRecentlyFailedPosts)
- `components/dashboard/FailedPostsAlert.tsx` (nouveau)
- `app/page.tsx` (modifié — import + affichage)
