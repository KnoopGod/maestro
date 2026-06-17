# Spec 031 — Recherche textuelle dans /plan

## Contexte

La page /plan liste jusqu'à 100 posts avec des filtres par statut et client. Quand une agence
accumule 100+ posts, retrouver un post précis (ex: "le post Instagram du Restaurant X sur le menu
du weekend du mois dernier") est laborieux sans recherche texte.

## User Story

> En tant qu'agent HORECA, je veux pouvoir taper des mots-clés dans /plan pour filtrer
> les posts par caption, brief ou hashtags, sans perdre les autres filtres actifs.

## Comportement

- Champ de recherche dans la zone de filtres de /plan
- Recherche dans : caption, brief, hashtags (LIKE SQL, insensible à la casse)
- Préserve les autres filtres URL actifs (status=, client=)
- Debounce 400ms — pas de soumission manuelle requise
- Affiche le nombre de résultats et le terme cherché
- Bouton ✕ pour effacer la recherche

## Architecture

- `lib/db/queries/posts.ts` — `listPosts()` accepte `q?: string` (ajoute condition SQL)
- `components/plan/PlanSearchInput.tsx` — `'use client'` : input avec debounce + useRouter
- `app/plan/page.tsx` — accepte `q` dans searchParams, passe à listPosts(), affiche PlanSearchInput

## Fichiers

- `CODEX_SPECS/031-plan-text-search.md`
- `lib/db/queries/posts.ts` (modifié — option q dans listPosts)
- `components/plan/PlanSearchInput.tsx` (nouveau)
- `app/plan/page.tsx` (modifié)
