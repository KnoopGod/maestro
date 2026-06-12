# CODEX_SPECS/012 — Régénération partielle (texte seul) + hashtags éditables en chips

## Context

Audit UX du 2026-06-12 (Mission Architecture Produit V2) — problèmes H2 et M2 :

1. **H2 — "Régénérer le post" relance tout le pipeline** (texte + image + scoring),
   coûteux et lent. Si seul le caption déplaît, l'utilisateur ne peut pas garder
   l'image et régénérer uniquement le texte. La route `/api/studio/generate-caption`
   **existe déjà** et appelle `generateCaption` seul — mais rien ne persiste son
   résultat sur un post existant.
2. **M2 — Les hashtags sont du texte figé.** Pas de suppression individuelle,
   pas d'ajout manuel.

Fichiers à lire avant de commencer :
- `app/api/studio/generate-caption/route.ts` (route existante, génération sans persistance)
- `lib/db/queries/posts.ts` (pattern des UPDATE existants : `schedulePost`, `markPostFailed`)
- `components/studio/StudioForm.tsx` (état `result`, bouton "Régénérer le post", `CaptionResult`)
- `types/post.ts`

---

## Goal

Depuis l'écran de résultat du Studio : régénérer **uniquement le texte** (l'image et
le score restent), supprimer un hashtag d'un clic, en ajouter un à la main — le tout
persisté en DB sur le draft.

---

## Fichiers à modifier / créer

### 1. `lib/db/queries/posts.ts` — nouvelle query

```typescript
export async function updatePostContent(
  id: string,
  input: { caption?: string; hashtags?: string[]; hook?: string; cta?: string }
): Promise<Post>
```

- UPDATE partiel : ne modifier que les champs fournis (construire le SET dynamiquement,
  même pattern que les queries existantes). `hashtags` est stocké en JSON
  (`JSON.stringify`). Toujours mettre à jour `updated_at`.
- Refuser la modification si le post est `published` : lire le statut d'abord et
  `throw new Error('Post déjà publié — modification impossible')`.
- Retourner le post mappé (réutiliser `mapRow` / le SELECT helper existant).

### 2. `app/api/posts/[id]/route.ts` — nouvelle route (PATCH)

```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> })
```

- Body accepté : `{ caption?: string, hashtags?: string[], hook?: string, cta?: string }`.
- Valider : `caption` string non vide si fournie ; `hashtags` array de strings
  (trim, retirer les `#` de tête, dédupliquer, max 30).
- Appeler `updatePostContent`, retourner `{ success: true, post }`.
- 404 si post introuvable, 409 si déjà publié, 400 si body invalide.

### 3. `app/api/studio/regenerate-caption/route.ts` — nouvelle route (POST)

Body : `{ postId: string, instruction?: string }`.

1. Charger le post (`getPost`) + le client. 404 si absent, 409 si `published`.
2. Appeler `generateCaption` (depuis `lib/agents/social-expert`) avec le client,
   les `platforms` du post, le `contentType` du post, et la brief :
   `instruction?.trim() ? `${post.brief}\n\nConsigne de révision : ${instruction.trim()}` : post.brief`.
3. Persister via `updatePostContent(postId, { caption, hashtags, hook, cta })`
   en prenant la **première** caption retournée (le post stocke un seul caption).
4. Incrémenter le coût du post si une colonne `cost` existe (additionner
   `result.cost` au coût actuel — UPDATE simple), sinon ignorer.
5. Retourner `{ success: true, post, captions: result.captions, cost: result.cost }`.

### 4. `components/studio/StudioForm.tsx`

#### A. Bouton "Régénérer le texte uniquement"

À côté du bouton existant "Régénérer le post" (qui relance tout), ajouter :

```
[✏️ Régénérer le texte]  [champ optionnel : "Précise ta demande…"]
```

- Un input texte inline optionnel (`instruction`) — placeholder
  `Ex : plus court, sans emoji, mentionner la terrasse…`.
- Au clic : POST `/api/studio/regenerate-caption` avec `{ postId: result.post.id,
  instruction }`. Pendant l'appel : spinner sur le bouton, le reste de l'écran intact.
- À la réponse : mettre à jour `result` en remplaçant `post` et `captions`
  (conserver `reasoning`, `directive`, image inchangée). Vider `instruction`.
- Renommer le bouton existant en "Tout régénérer (texte + image)" pour clarifier.

#### B. Hashtags en chips éditables (dans `CaptionResult`)

`CaptionResult` reçoit deux nouvelles props optionnelles :

```typescript
postId?: string
onHashtagsChange?: (hashtags: string[]) => void
```

Sous la preview (zone Insights), remplacer l'affichage statique des hashtags par :

- Chaque hashtag = chip `text-xs bg-blue-950/40 border border-blue-800/40 text-blue-300
  rounded-full px-2.5 py-1 flex items-center gap-1` avec un `×` cliquable
  (`hover:text-red-400`).
- Un input "+ hashtag" en fin de liste (`Enter` pour valider, normaliser : trim,
  retirer `#`, lowercase, refuser doublons et vide).
- À chaque modification : PATCH `/api/posts/${postId}` avec `{ hashtags }` (debounce
  inutile, requête au changement), puis `onHashtagsChange(hashtags)` pour synchroniser
  l'état parent (`result`).
- Si `postId` est absent (preview sans draft) : chips en lecture seule (comportement actuel).

Note : la preview IG affiche les hashtags dans le caption mockup — la garder branchée
sur la même liste pour que la suppression d'un chip retire aussi le tag de la preview.

---

## Don't touch

- `lib/agents/social-expert.ts` (la génération elle-même ne change pas)
- `app/api/studio/generate-post/route.ts` (pipeline complet inchangé)
- `lib/agents/pipeline.ts`, `lib/agents/publish-pipeline.ts`
- `lib/db/schema.ts`, migrations (aucune colonne nouvelle)

---

## Validation

```bash
npx tsc --noEmit
npm run build
```

Test API (avec un draft existant en DB) :

```bash
# PATCH hashtags
curl -s -X PATCH localhost:3010/api/posts/<draftId> \
  -H 'content-type: application/json' \
  -d '{"hashtags":["brunch","kohsamui","#sunrise"]}' | head -c 400
# → hashtags normalisés sans '#', success:true

# Régénération texte seul
curl -s -X POST localhost:3010/api/studio/regenerate-caption \
  -H 'content-type: application/json' \
  -d '{"postId":"<draftId>","instruction":"plus court, sans emoji"}' | head -c 400
# → nouveau caption persisté, imageUrl inchangé
```

## Output expected

Résumé des fichiers créés/modifiés + résultat des deux curl (ou explication si
pas de draft disponible en local).
