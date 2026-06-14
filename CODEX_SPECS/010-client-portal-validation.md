# Spec 010 — Validation des posts par le client (portail)

**Date** : 2026-06-14
**Priorité** : Haute — débloque la boucle agence ↔ client avant publication

---

## Objectif

Permettre au client de valider ou de demander des modifications sur ses posts directement
depuis son portail public (`/portal/[token]`), sans compte ni mot de passe.
L'agence partage le lien portail ; le client voit les posts `ready` en attente et peut agir.

---

## Règles métier

- Un post `ready` est visible dans la section de validation côté portail.
- Le client peut **approuver** (`action: 'approved'`) : le statut reste `ready`.
  L'agence décide ensuite de scheduler ou publier manuellement.
- Le client peut **demander des modifications** (`action: 'changes_requested'`) :
  le statut repasse à `draft` pour que l'agence retravaille le contenu.
- Un client ne peut agir que sur les posts qui lui appartiennent ET qui ont le statut `ready`.
- Le feedback est horodaté et stocké en JSON dans `portal_feedback`.
- Un post déjà approuvé ou repassé en draft ne peut pas être re-validé via le portail
  (son statut ne sera plus `ready`).

---

## 1. Migration DB

**Fichier à créer** : `lib/db/migrations/011-add-portal-feedback.ts`

Pattern identique aux migrations existantes (`010-add-client-summary.ts`) :

```typescript
import { db } from '../index'

export async function migratePortalFeedback() {
  await db
    .execute(`ALTER TABLE posts ADD COLUMN portal_feedback TEXT`)
    .catch(() => undefined)
}
```

**Fichier à modifier** : `lib/db/schema.ts`

À la fin de `initSchema()`, après l'import de `migrateClientSummary`, ajouter :

```typescript
const { migratePortalFeedback } = await import('./migrations/011-add-portal-feedback')
await migratePortalFeedback()
```

La colonne `portal_feedback` est un TEXT nullable stockant un objet `PortalFeedback`
sérialisé en JSON. SQLite ignore la contrainte `IF NOT EXISTS` sur `ALTER TABLE` ;
le `.catch(() => undefined)` rend l'opération idempotente.

---

## 2. Types — `types/post.ts`

Ajouter l'interface suivante **avant** l'interface `Post` :

```typescript
export interface PortalFeedback {
  action: 'approved' | 'changes_requested'
  comment: string        // chaîne vide si aucun commentaire
  reviewedAt: number     // timestamp ms (Date.now())
}
```

Ajouter le champ dans l'interface `Post` existante, après `supervisorReview` :

```typescript
portalFeedback: PortalFeedback | null
```

Importer `PortalFeedback` dans les fichiers qui en ont besoin ; ne pas dupliquer la définition.

---

## 3. Queries — `lib/db/queries/posts.ts`

### 3.1 `PostRow` (interface interne)

Ajouter le champ après `supervisor_review` :

```typescript
portal_feedback: string | null
```

### 3.2 `mapRow`

Ajouter après la ligne `supervisorReview` :

```typescript
portalFeedback: (() => {
  try { return row.portal_feedback ? JSON.parse(row.portal_feedback) as PortalFeedback : null }
  catch { return null }
})(),
```

### 3.3 `postSelect()`

Ajouter `portal_feedback` dans la liste des colonnes sélectionnées :

```typescript
function postSelect(includeInsights: boolean) {
  return `
    id, client_id, status, platforms, content_type, brief, reasoning,
    caption, hashtags, hook, cta, cta_type, cta_url, image_asset_id, image_url, image_prompt,
    impact_score, impact_analysis, supervisor_review, portal_feedback, meta_post_ids,
    ${includeInsights ? 'meta_insights' : 'NULL AS meta_insights'},
    scheduled_at, published_at, error, cost, tokens_used, created_at, updated_at
  `
}
```

Attention : `getPost()` utilise `SELECT *` — il récupère déjà la colonne dès qu'elle existe.
`listPosts()` passe par `postSelect()` — la modification ci-dessus suffit.

### 3.4 Nouvelle fonction `setPortalFeedback`

Ajouter à la fin du fichier. L'import de `PortalFeedback` doit être ajouté dans la ligne
`import type { ... } from '@/types/post'` existante.

```typescript
export async function setPortalFeedback(
  id: string,
  feedback: PortalFeedback
): Promise<Post> {
  const now = Date.now()
  const newStatus = feedback.action === 'changes_requested' ? 'draft' : undefined

  const row = await queryOne<PostRow>(
    newStatus
      ? `UPDATE posts SET portal_feedback = ?, status = ?, updated_at = ? WHERE id = ? RETURNING *`
      : `UPDATE posts SET portal_feedback = ?, updated_at = ? WHERE id = ? RETURNING *`,
    newStatus
      ? [JSON.stringify(feedback), newStatus, now, id]
      : [JSON.stringify(feedback), now, id]
  )
  if (!row) throw new Error('Post introuvable')
  return mapRow(row)
}
```

---

## 4. Route API publique — `app/api/portal/[token]/posts/[postId]/review/route.ts`

**Fichier à créer.**

Cette route est accessible sans auth admin car son chemin commence par `/portal/`
— `isPublicPath()` dans `proxy.ts` autorise déjà le préfixe. **Ne pas modifier `proxy.ts`.**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getClientByPortalToken } from '@/lib/db/queries/portal'
import { getPost, setPortalFeedback } from '@/lib/db/queries/posts'
import type { PortalFeedback } from '@/types/post'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; postId: string }> }
) {
  const { token, postId } = await params

  // 1. Résoudre le client depuis le jeton (null = 404 générique, aucune fuite)
  const client = await getClientByPortalToken(token)
  if (!client) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })

  // 2. Charger le post
  const post = await getPost(postId)
  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

  // 3. Vérifier appartenance + statut
  if (post.clientId !== client.id) {
    return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  }
  if (post.status !== 'ready') {
    return NextResponse.json(
      { error: 'Ce post n\'est plus en attente de validation.' },
      { status: 409 }
    )
  }

  // 4. Parser et valider le body
  let body: { action?: unknown; comment?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { action, comment } = body
  if (action !== 'approved' && action !== 'changes_requested') {
    return NextResponse.json(
      { error: 'action doit être "approved" ou "changes_requested"' },
      { status: 400 }
    )
  }
  if (comment !== undefined && typeof comment !== 'string') {
    return NextResponse.json({ error: 'comment doit être une chaîne' }, { status: 400 })
  }

  // 5. Persister le feedback
  const feedback: PortalFeedback = {
    action,
    comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : '',
    reviewedAt: Date.now(),
  }
  const updated = await setPortalFeedback(postId, feedback)

  return NextResponse.json({ ok: true, status: updated.status })
}
```

**Sécurité** : le token est l'unique autorisation. La vérification `post.clientId !== client.id`
empêche tout accès cross-client. Limiter `comment` à 1000 caractères côté serveur.

---

## 5. Composant client — `components/portal/PortalReviewCard.tsx`

**Fichier à créer.** Client Component (fetch vers la route API, router.refresh()).

```typescript
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Post } from '@/types/post'

interface Props {
  post: Post
  token: string
}

export function PortalReviewCard({ post, token }: Props) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (action: 'approved' | 'changes_requested') => {
    startTransition(async () => {
      setError(null)
      const res = await fetch(
        `/api/portal/${token}/posts/${post.id}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, comment: comment.trim() || undefined }),
        }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Erreur inattendue')
        return
      }
      router.refresh()
    })
  }

  const dateStr = new Date(post.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4">
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{post.caption}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-400">
            <span className="capitalize">{post.platforms.join(' + ')}</span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      {showComment && (
        <div className="px-4 pb-3">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Précisez les modifications souhaitées (optionnel)…"
            maxLength={1000}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none outline-none focus:border-orange-400 text-gray-700"
          />
        </div>
      )}

      {error && (
        <p className="px-4 pb-2 text-xs text-red-500">{error}</p>
      )}

      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit('approved')}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : '✓ Approuver'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!showComment) { setShowComment(true); return }
            submit('changes_requested')
          }}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : showComment ? 'Envoyer' : '✎ Demander des modifications'}
        </button>
      </div>
    </div>
  )
}
```

UX : le bouton "Demander des modifications" affiche d'abord un textarea, puis un second clic
envoie. Cela évite les clics accidentels.

---

## 6. Page portail — `app/portal/[token]/page.tsx`

**Fichier à modifier** — ne pas toucher à la logique existante (KPIs, posts publiés).

### 6.1 Import à ajouter

```typescript
import { PortalReviewCard } from '@/components/portal/PortalReviewCard'
```

### 6.2 Données à charger

Dans le bloc de chargement des données existant, ajouter le filtre des posts `ready` :

```typescript
const pendingPosts = allPosts.filter(p => p.status === 'ready')
```

`allPosts` est déjà chargé via `listPosts({ clientId: client.id, limit: 500 })` —
pas de requête supplémentaire.

### 6.3 Section à insérer dans le JSX

Insérer **avant** la section KPIs (`<section className="px-6 sm:px-10 py-8 border-b border-gray-200">`) :

```tsx
{/* Validation des posts */}
<section className="px-6 sm:px-10 py-8 border-b border-gray-200">
  <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">
    Contenus en attente de votre validation
  </h2>
  {pendingPosts.length === 0 ? (
    <p className="text-sm text-gray-400 italic">Aucun contenu en attente de validation.</p>
  ) : (
    <div className="space-y-4">
      {pendingPosts.map(p => (
        <PortalReviewCard key={p.id} post={p} token={token} />
      ))}
    </div>
  )}
</section>
```

`token` est déjà disponible (issu de `await params`).

---

## 7. Page admin client — `app/clients/[id]/page.tsx`

`PortalLinkCard` est **déjà importé et utilisé** dans cette page
(ligne 14 : `import { PortalLinkCard } from '@/components/clients/PortalLinkCard'`).

Aucune modification requise sur ce fichier. L'encart portail existe.

Si `PortalLinkCard` ne s'affiche pas visuellement dans la page, vérifier qu'il est bien
rendu dans le JSX (chercher `<PortalLinkCard`). S'il est absent du JSX, l'ajouter dans
la colonne latérale, à la suite des autres cards d'action :

```tsx
<PortalLinkCard clientId={client.id} />
```

---

## Fichiers à créer

| Fichier | Rôle |
|---|---|
| `lib/db/migrations/011-add-portal-feedback.ts` | Migration ALTER TABLE posts |
| `app/api/portal/[token]/posts/[postId]/review/route.ts` | Route POST publique de validation |
| `components/portal/PortalReviewCard.tsx` | Client Component carte de validation |

## Fichiers à modifier

| Fichier | Changement |
|---|---|
| `lib/db/schema.ts` | Appel `migratePortalFeedback()` en fin de `initSchema()` |
| `types/post.ts` | Interface `PortalFeedback` + champ `portalFeedback` dans `Post` |
| `lib/db/queries/posts.ts` | `PostRow`, `mapRow`, `postSelect()`, nouvelle fonction `setPortalFeedback` |
| `app/portal/[token]/page.tsx` | Import `PortalReviewCard`, variable `pendingPosts`, section JSX |

## Fichiers à ne pas toucher

- `proxy.ts` — `/portal/` est déjà dans `isPublicPath()`, aucune modification nécessaire.
- `lib/db/queries/portal.ts` — aucune modification.
- `app/api/clients/[id]/portal/route.ts` — aucune modification.
- `components/clients/PortalLinkCard.tsx` — déjà implémenté et fonctionnel.

---

## Validation

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Zéro erreur TypeScript, zéro warning lint. Le build doit compléter sans erreur.

### Tests manuels

1. Générer un post, le passer en statut `ready` via le studio.
2. Ouvrir le lien portail du client (`/portal/[token]`).
3. Vérifier que la section "Contenus en attente de votre validation" apparaît avec le post.
4. Cliquer "✓ Approuver" → la carte disparaît, le post reste `ready` en DB.
5. Générer un second post `ready`, cliquer "✎ Demander des modifications" → textarea apparaît,
   cliquer "Envoyer" → carte disparaît, post repasse en `draft` en DB, `portal_feedback` enregistré.
6. Vérifier en DB : `SELECT id, status, portal_feedback FROM posts WHERE id = '...'`.
7. Tester avec un `token` invalide → 404.
8. Tester avec un `postId` d'un autre client → 404.

---

## Risques

- **CSRF sur la route review** : la route est publique (pas de cookie admin), donc pas de risque
  CSRF au sens classique. Le jeton dans l'URL est l'autorisation. Acceptable pour la V1.
- **Spam de feedback** : aucun rate-limiting. À ajouter en V2 si le portail devient public.
- **Concurrent reviews** : si deux personnes approuvent simultanément, les deux requêtes réussiront
  (idempotent pour `approved`). Pour `changes_requested`, le statut final sera `draft` dans les deux cas.
- **`portal_feedback` ne bloque pas le scheduler** : un post approuvé reste `ready` et peut
  être schedulé/publié par l'agence sans autre vérification. C'est le comportement voulu en V1.
