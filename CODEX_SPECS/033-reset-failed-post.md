# Spec 033 — Reset Failed Post to Draft

## Contexte

Quand un post échoue à la publication (token expiré, URL inaccessible, erreur Meta), il reste
en statut `failed`. L'agent doit corriger la cause (renouveler le token, corriger l'URL publique)
puis réessayer. Il manquait un bouton "Remettre en brouillon" et un bouton "Réessayer" visible
sur les posts en échec.

## User Story

> En tant qu'agent HORECA, je veux pouvoir remettre un post failed en brouillon pour le corriger
> et réessayer la publication, sans avoir à supprimer et recréer le post.

## Comportement

- Bannière rouge au sommet de PostActions quand `status === 'failed'`
- Bouton "Remettre en brouillon" : remet le post en `draft`, efface `error`
- Bouton "Réessayer" : tente directement la publication (mêmes contraintes que "Publier maintenant")
- L'endpoint valide que le post est bien en statut `failed` avant le reset

## Architecture

- `lib/db/queries/posts.ts` — `resetPostToDraft(id: string): Promise<Post>` — UPDATE status='draft', error=NULL
- `app/api/posts/[id]/reset/route.ts` — POST endpoint, vérifie status=failed
- `components/posts/PostActions.tsx` — bannière + boutons "Remettre en brouillon" / "Réessayer"

## Fichiers

- `CODEX_SPECS/033-reset-failed-post.md`
- `lib/db/queries/posts.ts` (modifié — resetPostToDraft)
- `app/api/posts/[id]/reset/route.ts` (nouveau)
- `components/posts/PostActions.tsx` (modifié — fail state banner)
