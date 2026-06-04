# CODEX_SPECS/006 — Boucle d'apprentissage performance

## Context

Le pipeline actuel (Account Director → Social Expert → Visual Director → Supervisor) génère du contenu
de qualité générique. Mais Maestro a déjà des données de performance réelles stockées dans
`posts.meta_insights` (likes, reach, engagement par post publié).

Ces données ne sont pas encore utilisées pour améliorer la génération suivante.
Ce spec ferme la boucle : les agents voient ce qui a marché pour CE client et s'en inspirent.

**Aucun changement de schema. Aucune nouvelle table. Lecture uniquement de données existantes.**

---

## Principe

```
Published posts avec meta_insights
          ↓
  Calculer engagement rate = (likes + comments + shares) / reach × 100
          ↓
  Top 3 posts → Account Director (choisit les bons piliers/angles)
  Top 2 posts → Social Expert (exemples de style et ton)
```

---

## Fichiers à modifier

### 1. `lib/agents/pipeline.ts`

**Avant l'étape 1 (Account Director)**, ajouter le chargement des top performers :

```typescript
import { listPosts } from '@/lib/db/queries/posts'
import type { Post } from '@/types/post'

// Fonction utilitaire — calcule le taux d'engagement moyen d'un post
function engagementRate(post: Post): number {
  if (!post.metaInsights.length) return 0
  const total = post.metaInsights.reduce((sum, i) => {
    const reach = i.reach ?? 0
    if (reach === 0) return sum
    const eng = ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
    return sum + eng
  }, 0)
  return parseFloat((total / post.metaInsights.length).toFixed(2))
}
```

Ajouter **avant** l'appel `runAccountDirector` :

```typescript
// Charger les posts publiés avec insights pour le learning loop
const publishedPosts = await listPosts({ clientId: client.id, status: 'published', limit: 30 })
const postsWithInsights = publishedPosts
  .filter(p => p.metaInsights.length > 0)
  .map(p => ({ ...p, _engRate: engagementRate(p) }))
  .sort((a, b) => b._engRate - a._engRate)

const topPosts = postsWithInsights.slice(0, 3)
const allRecentForAD = publishedPosts.slice(0, 10) // pour détection de répétition piliers
```

Modifier l'appel `runAccountDirector` pour passer les top posts :

```typescript
const account = await track(
  () => runAccountDirector({ client, userBrief, recentPosts: allRecentForAD, topPosts }),
  ...
)
```

Modifier l'appel `generateCaption` pour passer les top posts :

```typescript
const text = await track(
  () => generateCaption({ client, brief: effectiveBrief, platforms, contentType, topPosts: topPosts.slice(0, 2) }),
  ...
)
```

---

### 2. `lib/agents/account-director.ts`

**Ajouter `topPosts` au type d'input :**

```typescript
export async function runAccountDirector(input: {
  client: Client
  userBrief?: string
  recentPosts?: Post[]
  topPosts?: Post[]   // ← nouveau
}): Promise<{ directive: AccountDirective; cost: number; tokensUsed: number; model: string }> {
```

Ajouter une fonction helper dans le fichier (après les imports) :

```typescript
function engRate(post: Post): number {
  if (!post.metaInsights?.length) return 0
  const total = post.metaInsights.reduce((sum, i) => {
    const reach = i.reach ?? 0
    if (reach === 0) return sum
    return sum + ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
  }, 0)
  return parseFloat((total / post.metaInsights.length).toFixed(2))
}
```

Dans le `userPrompt`, remplacer la section `# POSTS RÉCENTS` par :

```typescript
# POSTS RÉCENTS (${recentPosts.length} derniers)

${recentPosts.length ? recentPosts.map((post, index) => {
  const pillar = guessPillar(post, client.strategy.contentPillars)
  const rate = engRate(post)
  const perf = rate > 0 ? ` | Engagement : ${rate}%` : ''
  const flag = rate >= 3 ? ' ★ SURPERFORMANT' : rate > 0 && rate < 1 ? ' ↓ faible' : ''
  return `${index + 1}. Brief : ${post.brief} | Pilier : ${pillar} | Hook : ${post.hook || '—'}${perf}${flag}`
}).join('\n') : 'Aucun post récent.'}
```

Ajouter **après** la section `# POSTS RÉCENTS`, une nouvelle section `# APPRENTISSAGE` :

```typescript
${topPosts && topPosts.length > 0 ? `
# APPRENTISSAGE — CE QUI A MARCHÉ POUR CE CLIENT

Les posts suivants ont généré le meilleur engagement réel. Utilise ces patterns pour choisir le prochain angle.

${topPosts.map((p, i) => {
  const rate = engRate(p)
  const pillar = guessPillar(p, client.strategy.contentPillars)
  return `${i + 1}. Engagement ${rate}% · Pilier : ${pillar}
   Hook : ${p.hook || p.caption.slice(0, 80)}
   Brief : ${p.brief}`
}).join('\n\n')}

Si un pattern est clair (ex : les coulisses surperforment systématiquement les plats seuls), intègre-le dans ton choix de pilier et ton enrichedBrief.
` : '# APPRENTISSAGE\n\nPas encore de données de performance disponibles — utiliser la stratégie de base.'}
```

---

### 3. `lib/agents/social-expert.ts`

**Ajouter `topPosts` au type `GenerateCaptionInput` :**

```typescript
interface GenerateCaptionInput {
  client: Client
  brief: string
  platforms: Platform[]
  contentType?: 'photo' | 'reel' | 'story'
  topPosts?: Post[]   // ← nouveau
}
```

Ajouter l'import `Post` en haut du fichier :

```typescript
import type { Post } from '@/types/post'
```

Ajouter une fonction helper :

```typescript
function engRate(post: Post): number {
  if (!post.metaInsights?.length) return 0
  const total = post.metaInsights.reduce((sum, i) => {
    const reach = i.reach ?? 0
    if (reach === 0) return sum
    return sum + ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
  }, 0)
  return parseFloat((total / post.metaInsights.length).toFixed(2))
}
```

Dans le `userPrompt`, ajouter **après** `# BRIEF DU POST` et **avant** `# PLATEFORMES CIBLES` :

```typescript
${topPosts && topPosts.length > 0 ? `
# RÉFÉRENCES — TOP POSTS DE CE CLIENT

Ces captions ont généré le meilleur engagement réel pour ${client.name}.
Inspire-toi du style, du ton, de la structure du hook et du CTA. Ne copie pas — adapte.

${topPosts.map((p, i) => {
  const rate = engRate(p)
  return `--- Référence ${i + 1} (${rate}% engagement) ---
${p.caption}
Hook utilisé : ${p.hook || '—'}
CTA : ${p.cta || '—'}
Hashtags : ${p.hashtags.slice(0, 5).join(' ')}`
}).join('\n\n')}

` : ''}
```

---

## Validation

```bash
npx tsc --noEmit
npm run build
```

Zéro erreur attendu. Vérifier que :
- `topPosts` est optionnel partout (les agents fonctionnent sans insights si le client est nouveau)
- La fonction `engRate` est dupliquée dans les 3 fichiers (pas de module partagé pour éviter une refonte)

---

## Output expected

Un seul commit :
```
feat: fermer la boucle learning — top performers injectés dans Account Director et Social Expert
```

Push sur `claude/maestro-project-handoff-L67ha`.  
**Ne pas merger sur main** — Bradley valide le diff.
