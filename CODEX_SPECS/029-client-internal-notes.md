# Spec 029 — Notes internes client

## Contexte

Les agences gérant des dizaines de clients HORECA accumulent des informations opérationnelles
qui ne rentrent pas dans les champs existants : contacts spécifiques, contraintes de planning,
historique des échanges, préférences éditoriales non formalisées.

Ces notes sont strictement internes à l'agence — elles ne doivent jamais être transmises
aux agents IA ni visibles dans le portail client.

## User Story

> En tant qu'agent d'agence, je veux pouvoir noter des informations opérationnelles sur un client
> (contacts, contraintes, historique) directement dans MAESTRO, sans que cela n'affecte les
> générations IA ni le portail client.

## Comportement

- Nouveau champ `internalNotes` sur le client (texte libre, optionnel)
- Visible et éditable dans `/clients/[id]/edit` dans une section dédiée "Notes internes"
- Affiché sur la page client `/clients/[id]` avec un fond ambré distinctif si non vide
- N'est **jamais** transmis aux agents IA (distinct de `clientSummary`)
- N'est **jamais** exposé via le portail client

## Architecture

- `lib/db/migrations/014-add-client-notes.ts` — migration idempotente : ajoute `internal_notes TEXT` à la table `clients`
- `lib/db/schema.ts` — appelle la migration 014
- `types/client.ts` — ajoute `internalNotes: string | null` à l'interface `Client`
- `lib/db/queries/clients.ts` — `ClientRow.internal_notes`, `mapRow()`, `updateClient()` mapping
- `lib/actions/clients.ts` — `updateClientAction()` : `internalNotes` dans les champs optionnels
- `app/clients/[id]/edit/page.tsx` — fieldset "Notes internes" avec textarea (focus amber)
- `app/clients/[id]/page.tsx` — section conditionnelle ambré avant "Posts récents"

## Fichiers

- `CODEX_SPECS/029-client-internal-notes.md`
- `lib/db/migrations/014-add-client-notes.ts` (nouveau)
- `lib/db/schema.ts` (modifié)
- `types/client.ts` (modifié)
- `lib/db/queries/clients.ts` (modifié)
- `lib/actions/clients.ts` (modifié)
- `app/clients/[id]/edit/page.tsx` (modifié)
- `app/clients/[id]/page.tsx` (modifié)
