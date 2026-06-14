# Spec 015 — Opérations en masse sur les posts

**Date** : 2026-06-14
**Priorité** : Haute (productivité agence)
**Dépend de** : Spec 004 (posts table), validation page existante

---

## Contexte

La page `/validation` affiche une grille de posts (draft/ready/failed).
Quand une agence produit 20+ posts par client, les actions individuelles deviennent lentes.
Cette spec ajoute une sélection multiple + actions groupées.

---

## Périmètre

### Fichiers à créer
- `app/api/posts/bulk/route.ts` — POST : action (delete/mark-ready/mark-draft) sur une liste d'IDs
- `components/posts/BulkActions.tsx` — barre flottante avec cases à cocher + boutons d'action

### Fichiers à modifier
- `app/validation/page.tsx` — envelopper dans `BulkSelectionProvider`, ajouter la barre flottante

---

## API

### `POST /api/posts/bulk`

```json
{ "ids": ["id1", "id2"], "action": "delete" | "mark-ready" | "mark-draft" }
```

Réponses :
- `200` : `{ ok: true, affected: N }`
- `400` : `{ error: "Champs manquants" }`
- `207` : résultats mixtes (certains ont échoué)

Règles :
- `delete` : refuse les posts `published` (retourne warning, continue les autres)
- `mark-ready` : accepte seulement `draft` | `failed`
- `mark-draft` : accepte seulement `ready`
- Max 50 IDs par requête

---

## Implémentation

### `app/api/posts/bulk/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePostStatus, deletePost } from '@/lib/db/queries/posts'

const ALLOWED_ACTIONS = ['delete', 'mark-ready', 'mark-draft'] as const
type BulkAction = typeof ALLOWED_ACTIONS[number]

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { ids, action } = body

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50 || !ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
  }

  const results = await Promise.allSettled(ids.map(id => processOne(id, action)))
  const affected = results.filter(r => r.status === 'fulfilled').length
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason?.message ?? 'Erreur')

  if (errors.length > 0 && affected === 0) {
    return NextResponse.json({ error: errors[0] }, { status: 422 })
  }

  return NextResponse.json({ ok: true, affected, errors: errors.length ? errors : undefined },
    { status: errors.length ? 207 : 200 })
}

async function processOne(id: string, action: BulkAction) {
  const post = await getPost(id)
  if (!post) throw new Error(`Post ${id} introuvable`)

  if (action === 'delete') {
    if (post.status === 'published') throw new Error(`Post ${id} déjà publié — non supprimable`)
    await deletePost(id)
  } else if (action === 'mark-ready') {
    if (!['draft', 'failed'].includes(post.status)) throw new Error(`Statut invalide pour mark-ready`)
    await updatePostStatus(id, 'ready')
  } else if (action === 'mark-draft') {
    if (post.status !== 'ready') throw new Error(`Statut invalide pour mark-draft`)
    await updatePostStatus(id, 'draft')
  }
}
```

### `components/posts/BulkActions.tsx`

Context + barre flottante :
- Cases à cocher par post card
- Barre flottante en bas (sticky) affichant "N sélectionnés" avec boutons
- Actions disponibles selon les statuts sélectionnés

---

## Validation

```bash
npx tsc --noEmit && npm run lint
```

Test manuel :
1. Sélectionner 3 posts draft → clic "Marquer prêts" → statuts passent à ready
2. Sélectionner 2 posts → clic "Supprimer" → confirmation → posts supprimés
3. Sélectionner un post published → refus de suppression avec message clair
