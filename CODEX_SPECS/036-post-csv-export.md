# Spec 036 — Post History CSV Export

## Contexte

Les agences HORECA ont besoin d'exporter leur historique de publications pour les bilans mensuels
clients, les reportings internes ou les sauvegardes. La page /plan affichait les posts mais
n'offrait aucune option d'export.

## User Story

> En tant qu'agent HORECA, je veux pouvoir exporter en CSV l'historique des posts (filtrés par
> client et/ou statut) pour les inclure dans mes rapports mensuels.

## Comportement

- Bouton "CSV" dans l'en-tête de /plan, à côté de "Nouveau post"
- Le bouton génère l'URL `/api/posts/export?clientId=X&status=Y` et déclenche un téléchargement
- Les filtres actifs (client, status) sont préservés dans l'URL d'export
- Limite : 500 posts par export
- Colonnes : id, client, statut, plateformes, type, pilier, brief, caption, hashtags, hook, cta,
  impact, coût, créé le, planifié le, publié le
- Encodage : UTF-8, séparateur virgule, guillemets pour les champs avec virgules/retours

## Architecture

- `app/api/posts/export/route.ts` — GET handler, produit text/csv
- `app/plan/page.tsx` — bouton "CSV" avec href pointant vers l'API

## Fichiers

- `CODEX_SPECS/036-post-csv-export.md`
- `app/api/posts/export/route.ts` (nouveau)
- `app/plan/page.tsx` (modifié — bouton CSV)
