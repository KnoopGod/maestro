# Architecture — Agents IA

## Principe

Chaque agent est une fonction TypeScript pure :
- Reçoit un contexte structuré (input typé)
- Appelle une API externe (Claude, OpenAI, Meta…)
- Retourne des données structurées (output typé)
- **Ne touche jamais la DB directement**
- Trace son coût et sa durée via `withTracking()`

## Agents actuels

### `account-director.ts`
**Rôle** : Analyser le profil client et enrichir le brief utilisateur.
**Input** : client, userBrief, recentPosts, topPosts
**Output** : directive (enrichedBrief, priorityPillar, contentAngle…), cost, tokensUsed
**Modèle** : Claude Sonnet 4.6

### `social-expert.ts`
**Rôle** : Générer les captions et hashtags adaptés à chaque plateforme.
**Input** : client, brief, platforms, contentType, topPosts
**Output** : captions[], reasoning, cost, tokensUsed
**Modèle** : Claude Sonnet 4.6

### `image-generator.ts`
**Rôle** : Générer une image et la stocker dans les assets du client.
**Input** : client, brief, caption, visualIdentity
**Output** : assetId, url, prompt, cost
**Modèle** : gpt-image-1 (OpenAI)

### `supervisor.ts`
**Rôle** : Contrôle qualité du post — verdict + score.
**Input** : client, post
**Output** : review (verdict: `ready|revise|blocked`, score, summary, suggestions[]), cost
**Modèle** : Claude Sonnet 4.6
**Note** : Non bloquant — si échec, le post est créé sans verdict.

### `vision-analyzer.ts`
**Rôle** : Analyser les images uploadées (description, tags, couleurs, mood).
**Input** : imageUrl, clientContext
**Output** : description, tags, dominantColors, mood, extractedText
**Modèle** : Claude Vision

### `visual-identity.ts`
**Rôle** : Synthétiser la Direction Artistique (DA) d'un client depuis ses assets.
**Input** : clientId, assets[]
**Output** : palette, lightingStyle, overallMood, stylePrompt, visualSummary
**Modèle** : Claude Sonnet 4.6

### `meta-publisher.ts`
**Rôle** : Publier un post sur Facebook et/ou Instagram via Graph API v23.0.
**Input** : post, socialAccount
**Output** : published (map plateforme → postId), warnings[]
**API** : Meta Graph API v23.0

### `pipeline.ts`
**Rôle** : Orchestrateur principal — enchaîne les 4 agents de génération.
**Séquence** : Account Director → Social Expert → Visual Director → Supervisor
**Note** : Synchrone et bloquant. À rendre asynchrone en Phase 4.

### `publish-pipeline.ts`
**Rôle** : Pipeline de publication avec re-supervision avant envoi.
**Séquence** : Supervisor (re-check) → Meta Publisher
**Gère** : `PublishBlockedError` si le supervisor bloque.

## Pattern de tracking

```typescript
const result = await withTracking(
  () => runAccountDirector(input),
  { jobId, agent: 'account-director', sequence: 1, taskLabel: 'Analyse client' },
  {
    onComplete: r => ({ outputSummary: `Brief enrichi`, cost: r.cost }),
    onError: () => ({ errorMessage: 'Erreur non bloquante', errorAction: 'retry' }),
  }
)
```

## Pattern de parsing JSON

Les réponses JSON de Claude peuvent être wrappées dans des blocs markdown.
Utiliser systématiquement ce pattern :

```typescript
function parseJSON<T>(text: string): T {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) return JSON.parse(match[1].trim())
    throw new Error('Impossible de parser la réponse JSON')
  }
}
```

## Coûts estimés par génération complète

| Agent | Modèle | Coût estimé |
|---|---|---|
| Account Director | Claude Sonnet 4.6 | ~$0.002 |
| Social Expert | Claude Sonnet 4.6 | ~$0.003 |
| Visual Director | gpt-image-1 | ~$0.04 |
| Supervisor | Claude Sonnet 4.6 | ~$0.002 |
| **Total** | | **~$0.047 / post** |
