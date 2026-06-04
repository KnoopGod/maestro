# CODEX_SPECS/004 — V1 Stabilisation

## Context

Maestro est un outil interne Next.js 16.2.6 (App Router) de gestion social media HORECA.  
Repo : `/home/user/maestro` — branche active : `claude/maestro-project-handoff-L67ha`.  
DB : LibSQL/Turso. UI : dark HUD theme, Tailwind, lucide-react.

**Ce spec implémente 4 blocs de stabilisation V1.** Chaque bloc est indépendant — si un bloc échoue, commite les autres quand même. L'ordre est la priorité.

---

## BLOC 1 — Merge codex/mvp-hardening

### Goal
Fusionner `origin/codex/mvp-hardening` dans la branche courante sans casser le build.

### Steps

```bash
git fetch origin
git merge origin/codex/mvp-hardening --no-edit
# Si conflits : garder la version de la branche courante sur proxy.ts, lib/db/index.ts, app/layout.tsx
# Les fichiers codex/mvp-hardening qui n'existent pas en local (docs/, lib/connection-registry.ts, etc.) → accepter les leurs
npm run build
npx tsc --noEmit
```

Si le merge produit un build propre → `git push origin claude/maestro-project-handoff-L67ha`.

### Don't touch
- `proxy.ts` — garder la version actuelle (no-op, pas d'auth)
- `app/login/page.tsx` — garder `redirect('/')`

---

## BLOC 2 — Checklist de démarrage sur la fiche client

### Goal
Afficher un bloc "Checklist de démarrage" dans `app/clients/[id]/page.tsx` qui montre la progression du client en 4 étapes.

### Files to modify
`app/clients/[id]/page.tsx`

### Changes

Le composant `ClientDetailPage` charge déjà : `assets`, `identity`, `socialAccounts`, `clientPosts`.  
Ajouter juste après le header (après le bloc `</div>` qui ferme le header avec la div `flex items-start gap-5 pb-6 border-b border-gray-800`), un bloc checklist :

```tsx
{/* Checklist de démarrage */}
{(() => {
  const steps = [
    {
      label: 'Profil configuré',
      done: !!(client.description || client.brandVoiceTone),
      href: `/clients/${client.id}/edit`,
    },
    {
      label: 'Meta connecté',
      done: socialAccounts.length > 0,
      href: `/clients/${client.id}/connections`,
    },
    {
      label: 'Direction artistique',
      done: !!identity?.stylePPrompt || assets.some(a => a.aiDescription),
      href: `/clients/${client.id}/library`,
    },
    {
      label: 'Premier post créé',
      done: clientPosts.length > 0,
      href: `/studio?client=${client.id}`,
    },
  ]
  const doneCount = steps.filter(s => s.done).length
  if (doneCount === steps.length) return null // masquer si tout est fait
  return (
    <div className="bg-indigo-950/30 border border-indigo-800/40 p-4">
      <div className="text-[8px] text-indigo-500 font-mono tracking-[0.3em] uppercase mb-3">
        // DÉMARRAGE · {doneCount}/{steps.length}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className={`flex items-center gap-2 p-2 border text-[10px] font-mono transition-colors ${
              step.done
                ? 'border-emerald-700/40 text-emerald-400 bg-emerald-950/20 pointer-events-none'
                : 'border-indigo-700/40 text-indigo-300 hover:border-indigo-500/60 hover:bg-indigo-950/20'
            }`}
          >
            {step.done
              ? <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-400" />
              : <Clock className="w-3 h-3 flex-shrink-0 text-indigo-500" />
            }
            <span className="truncate uppercase">{step.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
})()}
```

`CheckCircle2`, `Clock` sont déjà importés en haut du fichier. `Link` aussi.

### Don't touch
La logique existante de la page (stats, StrategyPanel, jobs, posts récents).

---

## BLOC 3 — Bouton "Modifier dans Studio" sur la page Validation

### Goal
Chaque post en statut `draft` ou `ready` dans `/validation` doit avoir un bouton "Modifier" qui ouvre Studio avec ce post chargé.

### Files to modify

**1. `app/validation/page.tsx`**

Chercher la section qui affiche les cards de posts (la boucle sur `queue`).  
Trouver le lien ou bouton le plus proche du titre/caption du post, et ajouter après les actions existantes :

```tsx
{(post.status === 'draft' || post.status === 'ready') && (
  <Link
    href={`/studio?postId=${post.id}&client=${post.clientId}`}
    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-indigo-700/40 text-indigo-400 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors"
  >
    <Edit3 className="w-2.5 h-2.5" />
    MODIFIER
  </Link>
)}
```

Ajouter `Edit3` à l'import lucide-react existant en haut du fichier.

**2. `app/studio/page.tsx`**

Le `searchParams` doit accepter `postId?` en plus de `client?` :

```tsx
export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; postId?: string }>
}) {
  const { client: initialClientId, postId } = await searchParams
```

Si `postId` est présent, charger le post et passer ses données au `StudioForm` :

```tsx
import { getPost } from '@/lib/db/queries/posts'
// ...
let initialPost = null
if (postId) {
  initialPost = await getPost(postId)
}
// ...
<StudioForm clients={clients} initialClientId={initialClientId ?? initialPost?.clientId} initialPost={initialPost} />
```

**3. `components/studio/StudioForm.tsx`**

Ajouter `initialPost?: Post | null` aux props :

```tsx
export function StudioForm({
  clients,
  initialClientId,
  initialPost,
}: {
  clients: Client[]
  initialClientId?: string
  initialPost?: Post | null
}) {
```

Dans le `useState` initial pour `brief`, initialiser depuis `initialPost` si disponible :

```tsx
const [brief, setBrief] = useState(initialPost?.brief || '')
const [clientId, setClientId] = useState(
  initialPost?.clientId || initialClientId || clients[0]?.id || ''
)
```

Afficher un bandeau si on édite un draft existant (mettre juste après l'ouverture du `<div className="space-y-6">`) :

```tsx
{initialPost && (
  <div className="bg-amber-950/30 border border-amber-700/40 p-3 text-[10px] font-mono text-amber-300">
    ✏ ÉDITION DU DRAFT — {initialPost.id.slice(0, 8).toUpperCase()}
  </div>
)}
```

### Type check
`Post` a un champ `brief: string` — vérifier dans `types/post.ts` que ce champ existe. S'il n'existe pas, utiliser `post.caption` (premier caption disponible) à la place.

---

## BLOC 4 — Page Analytics minimale par client

### Goal
Créer `app/clients/[id]/analytics/page.tsx` affichant les posts publiés du client avec leurs stats Meta.

### Files to create

**`app/clients/[id]/analytics/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart3, ExternalLink, TrendingUp } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'

export const dynamic = 'force-dynamic'

export default async function ClientAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const posts = await listPosts({ clientId: id, status: 'published', limit: 50 })

  const totalReach  = posts.reduce((s, p) => s + (p.insights?.reduce((a, i) => a + (i.reach  ?? 0), 0) ?? 0), 0)
  const totalLikes  = posts.reduce((s, p) => s + (p.insights?.reduce((a, i) => a + (i.likes  ?? 0), 0) ?? 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.insights?.reduce((a, i) => a + (i.comments ?? 0), 0) ?? 0), 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au client
      </Link>

      <div className="flex items-end justify-between border-b border-gray-800 pb-5">
        <div>
          <div className="text-[9px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-1">
            MAESTRO // ANALYTICS
          </div>
          <h1 className="text-2xl font-bold text-[#E0E3FF] tracking-wide flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            {client.name}
          </h1>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">{posts.length} posts publiés</span>
      </div>

      {/* Totaux */}
      {posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'REACH TOTAL',    value: totalReach,    color: 'text-indigo-400' },
            { label: 'LIKES TOTAL',    value: totalLikes,    color: 'text-pink-400' },
            { label: 'COMMENTAIRES',   value: totalComments, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="hud-corners bg-gray-900/60 border border-gray-800 p-4">
              <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.2em] uppercase mb-2">{label}</div>
              <div className={`text-2xl font-bold font-mono ${color}`}>{value.toLocaleString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Liste posts */}
      {posts.length === 0 ? (
        <div className="border border-gray-800 bg-gray-900/40 p-8 text-center">
          <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-[11px] text-gray-600 font-mono">AUCUN POST PUBLIÉ — LES STATS APPARAÎTRONT ICI APRÈS PUBLICATION</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-3">// POSTS PUBLIÉS</div>
          {posts.map((post) => {
            const reach    = post.insights?.reduce((a, i) => a + (i.reach    ?? 0), 0) ?? null
            const likes    = post.insights?.reduce((a, i) => a + (i.likes    ?? 0), 0) ?? null
            const comments = post.insights?.reduce((a, i) => a + (i.comments ?? 0), 0) ?? null
            const hasInsights = reach !== null

            return (
              <div key={post.id} className="border border-gray-800 bg-gray-900/40 p-4 flex items-start gap-4">
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-14 h-14 object-cover flex-shrink-0 border border-gray-700"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-300 font-mono line-clamp-2 mb-2">
                    {post.caption?.slice(0, 120)}…
                  </p>
                  {hasInsights ? (
                    <div className="flex items-center gap-4 text-[10px] font-mono">
                      <span className="text-indigo-400">{reach?.toLocaleString('fr-FR')} reach</span>
                      <span className="text-pink-400">{likes} likes</span>
                      <span className="text-emerald-400">{comments} commentaires</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-600 font-mono">INSIGHTS NON RÉCUPÉRÉS</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {post.metaPostIds && Object.entries(post.metaPostIds as Record<string, string>).map(([platform, pid]) => (
                    <a
                      key={platform}
                      href={platform === 'facebook'
                        ? `https://www.facebook.com/${pid}`
                        : `https://www.instagram.com/p/${pid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono border border-gray-700 text-gray-400 hover:text-indigo-300 hover:border-indigo-700/50 transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {platform.toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Ajouter un lien Analytics dans la fiche client** (`app/clients/[id]/page.tsx`) :

Dans la section des onglets de navigation du client (là où se trouvent les liens vers `/library`, `/connections`, `/agents`, etc.), ajouter :

```tsx
<Link href={`/clients/${client.id}/analytics`} className="...même style que les autres onglets...">
  <BarChart3 className="w-4 h-4" />
  Analytics
</Link>
```

`BarChart3` est déjà importé.

---

## Validation (à exécuter dans l'ordre)

```bash
npx tsc --noEmit          # Zéro erreur TypeScript
npm run build             # Build propre, zéro erreur
```

Si `types/post.ts` ne contient pas `brief`, remplacer `post.brief` par `post.caption` dans StudioForm et valider à nouveau.

---

## Output expected

```
git log --oneline -5
```

Doit montrer au minimum :
- Un commit "merge: codex/mvp-hardening into V1 stabilisation" (Bloc 1)
- Un commit "feat: V1 stabilisation — checklist, validation→studio, analytics" (Blocs 2-4)

Push sur `claude/maestro-project-handoff-L67ha`.  
**Ne pas merger sur main** — Bradley valide le diff avant le déploiement.
