# CODEX_SPECS/012 — Génération vidéo via Luma Dream Machine pour les Reels

## Contexte

Actuellement, le type de contenu `reel` n'utilise pas de génération IA pour la vidéo : le pipeline
skip l'étape Visual Director et l'utilisateur doit sélectionner une vidéo depuis la Library.

La variable `LUMA_API_KEY` est déjà présente dans `.env.example` mais n'est utilisée nulle part.

Ce spec ajoute :
- L'agent `video-creator.ts` qui appelle l'API Luma Dream Machine (text-to-video ou image-to-video)
- L'intégration dans `pipeline.ts` à l'étape 3 (Visual Director) pour les reels sans asset existant
- Une route `GET /api/studio/capabilities` pour exposer côté client si Luma est disponible
- Une note contextuelle dans `ContentTypeCard.tsx` selon la disponibilité de Luma

**Aucun changement de schéma DB.** La table `client_assets` supporte déjà `type = 'video'`.

---

## Fichiers à créer

### 1. `lib/agents/video-creator.ts`

#### Types

```typescript
import type { Client } from '@/types/client'

export interface VideoCreatorInput {
  client: Client
  brief: string
  prompt: string           // prompt visuel enrichi par le pipeline
  sourceImageUrl?: string  // optionnel : active le mode image-to-video
  contentType: 'reel' | 'story'
  jobId?: string
}

export interface VideoCreatorResult {
  assetId?: string
  url?: string
  prompt: string
  cost: number             // Luma ne facture pas à la token ; fixer à 0
  lumaGenerationId?: string
}
```

#### Constantes

```typescript
const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1/generations'
const POLL_INTERVAL_MS = 5_000
const POLL_MAX_ATTEMPTS = 24  // 24 × 5 s = 120 s max
```

#### Fonction principale

```typescript
export async function generateVideo(input: VideoCreatorInput): Promise<VideoCreatorResult>
```

**Logique, étape par étape :**

**A. Vérifier la clé**

```typescript
const apiKey = process.env.LUMA_API_KEY
if (!apiKey) throw new Error('LUMA_API_KEY non configuré')
```

**B. Construire le corps de la requête**

```typescript
const aspectRatio = '9:16'  // portrait pour reel/story

const body: Record<string, unknown> = {
  prompt: input.prompt || input.brief,
  aspect_ratio: aspectRatio,
  loop: false,
}

if (input.sourceImageUrl) {
  body.keyframes = {
    frame0: { type: 'image', url: input.sourceImageUrl },
  }
}
```

**C. Créer la génération Luma**

```typescript
const createRes = await fetch(LUMA_API_BASE, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

if (!createRes.ok) {
  const err = await createRes.text()
  throw new Error(`Luma API erreur création (${createRes.status}): ${err}`)
}

const { id: lumaGenerationId } = await createRes.json() as { id: string; state: string }
```

**D. Polling jusqu'à complétion**

```typescript
let videoUrl: string | undefined
for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
  await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

  const pollRes = await fetch(`${LUMA_API_BASE}/${lumaGenerationId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  if (!pollRes.ok) continue

  const gen = await pollRes.json() as { state: string; assets?: { video?: string }; failure_reason?: string }

  if (gen.state === 'completed') {
    videoUrl = gen.assets?.video
    break
  }
  if (gen.state === 'failed') {
    throw new Error(`Luma génération échouée : ${gen.failure_reason ?? 'raison inconnue'}`)
  }
  // state === 'pending' | 'processing' → continuer
}

if (!videoUrl) throw new Error('Luma : timeout — vidéo non disponible après 120 secondes')
```

**E. Télécharger la vidéo**

```typescript
const videoRes = await fetch(videoUrl)
if (!videoRes.ok) throw new Error(`Impossible de télécharger la vidéo Luma (${videoRes.status})`)
const arrayBuffer = await videoRes.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
```

**F. Stocker (Vercel Blob ou local)**

Utiliser `saveClientBuffer` de `lib/storage/local.ts` :

```typescript
import { saveClientBuffer } from '@/lib/storage/local'

const saved = await saveClientBuffer({
  clientId: input.client.id,
  buffer,
  mimeType: 'video/mp4',
  ext: '.mp4',
})
```

`saveClientBuffer` détecte automatiquement `BLOB_READ_WRITE_TOKEN` et route vers Vercel Blob ou
`public/uploads/clients/<clientId>/`. Aucune logique de stockage à dupliquer.

**G. Insérer dans `client_assets`**

```typescript
import { createAsset } from '@/lib/db/queries/assets'

const asset = await createAsset({
  clientId: input.client.id,
  type: 'video',
  category: 'reel',
  filename: saved.filename,
  originalName: `luma-${lumaGenerationId}.mp4`,
  url: saved.url,
  mimeType: saved.mimeType,
  sizeBytes: saved.sizeBytes,
})
```

**H. Retourner le résultat**

```typescript
return {
  assetId: asset.id,
  url: asset.url,
  prompt: input.prompt || input.brief,
  cost: 0,
  lumaGenerationId,
}
```

**I. Gestion d'erreur non bloquante**

La fonction `generateVideo` peut throw. C'est l'appelant (`pipeline.ts`) qui catch et retourne
`{ cost: 0, prompt: input.prompt }` pour ne pas bloquer le pipeline. Ne pas absorber les erreurs
dans l'agent lui-même — laisser remonter.

---

### 2. `app/api/studio/capabilities/route.ts`

Route GET publique (authentifiée par le middleware) retournant les capacités IA disponibles.

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    lumaEnabled: Boolean(process.env.LUMA_API_KEY),
    imageModel: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
  })
}
```

Pas de cache : la réponse doit refléter l'état réel de l'environnement au moment de l'appel.

---

## Fichiers à modifier

### 3. `lib/agents/pipeline.ts`

#### A. Ajouter l'import

En tête de fichier, après l'import de `generateAndStoreImage` :

```typescript
import { generateVideo } from '@/lib/agents/video-creator'
```

#### B. Modifier l'étape 3 — Visual Director

Localiser le bloc conditionnel à la ligne ~107 :

```typescript
  } else if (!skipImage) {
    const imageResult = await track(
      () => generateAndStoreImage({ ... }),
      { agent: 'visual-director', sequence: 3, taskLabel: 'Génération du visuel avec la DA du client' },
      ...
    ).catch(...)
    image = imageResult
  }
```

Remplacer par la logique suivante (conserver le bloc `existingAsset` et le bloc `skipImage`
inchangés — seul le bloc `else if (!skipImage)` est modifié) :

```typescript
  } else if (!skipImage) {
    if (contentType === 'reel') {
      // Génération vidéo via Luma Dream Machine
      const videoResult = await track(
        () => generateVideo({
          client,
          brief: effectiveBrief,
          prompt: visualPrompt?.trim() ? visualPrompt.trim() : effectiveBrief,
          contentType: 'reel',
          jobId,
        }),
        { agent: 'video-creator', sequence: 3, taskLabel: 'Génération de la vidéo Reel via Luma Dream Machine' },
        {
          onComplete: r => ({
            outputSummary: `Vidéo générée — Luma ID : ${r.lumaGenerationId ?? 'n/a'}`,
            outputData: { assetId: r.assetId, lumaGenerationId: r.lumaGenerationId },
            cost: r.cost,
          }),
          onError: () => ({ errorMessage: 'Erreur génération vidéo — post créé sans visuel', errorAction: 'retry' }),
        }
      ).catch(err => {
        console.error('Erreur génération vidéo non bloquante:', err)
        imageError = err instanceof Error ? err.message : 'Erreur génération vidéo inconnue'
        return { cost: 0 as number, assetId: undefined, url: undefined, prompt: effectiveBrief, lumaGenerationId: undefined }
      })
      image = videoResult
    } else {
      // Génération image via OpenAI (photo / story)
      const imageResult = await track(
        () => generateAndStoreImage({ client, brief: effectiveBrief, caption: primaryCaption.caption, visualIdentity: identity, visualPrompt, contentType }),
        { agent: 'visual-director', sequence: 3, taskLabel: 'Génération du visuel avec la DA du client' },
        {
          onComplete: r => ({
            outputSummary: `Image générée${identity?.stylePrompt ? ' avec Direction Artistique' : ''} — ${r.prompt?.substring(0, 80) ?? ''}`,
            outputData: { hasDA: !!identity?.stylePrompt, assetId: r.assetId },
            cost: r.cost,
          }),
          onError: () => ({ errorMessage: 'Erreur génération image — post créé sans visuel', errorAction: 'retry' }),
        }
      ).catch(err => {
        console.error('Erreur génération image non bloquante:', err)
        imageError = err instanceof Error ? err.message : 'Erreur génération image inconnue'
        return { cost: 0 as number, assetId: undefined, url: undefined, prompt: undefined }
      })
      image = imageResult
    }
  }
```

#### C. Ligne `models` dans le retour final (~ligne 206)

La ligne existante utilise `'gpt-image-1'` quand une image a été générée. Adapter pour les reels :

```typescript
// Avant (ligne ~206) :
models: [account.model, text.model, image.prompt ? (process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1') : 'image-skipped', supervisorModel].filter(Boolean) as string[],

// Après :
const visualModel = image.assetId
  ? (contentType === 'reel' ? 'luma-dream-machine' : (process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'))
  : 'visual-skipped'
models: [account.model, text.model, visualModel, supervisorModel].filter(Boolean) as string[],
```

---

### 4. `components/studio/ContentTypeCard.tsx`

Ce composant est un Client Component (`'use client'`). La disponibilité de Luma est connue via
l'appel à `GET /api/studio/capabilities`.

#### A. Ajouter le fetch des capabilities

```typescript
'use client'
import { useEffect, useState } from 'react'
import type { ContentType } from '@/lib/studio/types'
import { CONTENT_TYPE_INFO } from '@/lib/studio/types'

interface Capabilities {
  lumaEnabled: boolean
  imageModel: string
}

interface Props {
  contentType: ContentType
  onSelect: (type: ContentType) => void
}
```

Dans le composant :

```typescript
export function ContentTypeCard({ contentType, onSelect }: Props) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)

  useEffect(() => {
    fetch('/api/studio/capabilities')
      .then(r => r.json())
      .then((data: Capabilities) => setCapabilities(data))
      .catch(() => {/* silencieux — UI dégradée acceptée */})
  }, [])

  const reelNote = capabilities === null
    ? CONTENT_TYPE_INFO.reel.note
    : capabilities.lumaEnabled
      ? 'Vidéo IA via Luma Dream Machine · aspect 9:16'
      : 'Sélectionner une vidéo depuis la Library (LUMA_API_KEY requis pour la génération IA)'
  // ...
```

#### B. Afficher la note dynamique

Remplacer la ligne de note statique :

```tsx
// Avant :
<p className="mt-2 text-[11px] text-gray-500">{CONTENT_TYPE_INFO[contentType].note}</p>

// Après :
<p className="mt-2 text-[11px] text-gray-500">
  {contentType === 'reel' ? reelNote : CONTENT_TYPE_INFO[contentType].note}
</p>
```

---

## Ce qu'il ne faut pas toucher

- `lib/agents/image-generator.ts` — aucune modification
- `components/studio/ImageVisualCard.tsx` — aucune modification (gère déjà le mode library pour reels)
- `.env.local` — ne pas modifier ; `LUMA_API_KEY` doit déjà être présent si on veut activer la feature

---

## Comportement attendu selon l'environnement

| Environnement | `LUMA_API_KEY` | Résultat pour un Reel |
|---|---|---|
| Dev sans clé | absent | `imageError` dans le résultat, post créé sans visuel |
| Dev avec clé | présent | vidéo générée, stockée dans `public/uploads/clients/<id>/` |
| Prod sans clé | absent | `imageError`, post créé sans visuel |
| Prod avec clé | présent | vidéo générée, stockée dans Vercel Blob |

Le pipeline ne crash jamais à cause de l'agent vidéo — l'erreur est absorbée par le `.catch()`.

---

## Validation

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Vérifier manuellement :
1. Générer un post de type `photo` — comportement inchangé (régression zéro)
2. Générer un post de type `reel` sans `LUMA_API_KEY` — post créé, `imageError` présent dans la réponse
3. Générer un post de type `reel` avec `LUMA_API_KEY` valide — vidéo présente dans `client_assets`
4. `GET /api/studio/capabilities` retourne `{ lumaEnabled: false, imageModel: "gpt-image-1" }` sans clé
5. `ContentTypeCard` affiche la note Luma quand `reel` est sélectionné

---

## Risques

- **Timeout Vercel 60 s** : le polling Luma peut durer jusqu'à 120 s. En production sur Vercel, la
  génération de post dépassera le timeout si Luma est lent. Ce risque existait déjà pour les images
  OpenAI. **À traiter en Phase 4** (job asynchrone). Ne pas bloquer ce spec pour ça.
- **URL Luma temporaire** : l'URL CDN retournée par Luma (`assets.video`) est temporaire. Il faut
  impérativement télécharger et stocker la vidéo avant qu'elle expire — c'est ce que fait l'étape E.
- **Coût Luma** : le coût par génération n'est pas exposé dans la réponse API. La valeur `cost: 0`
  est intentionnellement conservatrice ; à mettre à jour quand Luma publie un endpoint de facturation.
