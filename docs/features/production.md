# Fonctionnalité : Pipeline de production

## Rôle

Le pipeline de production orchestre les agents IA pour générer un post complet à partir d'un brief. C'est le cœur du système MAESTRO.

## Fichiers

- `lib/agents/pipeline.ts` — pipeline de génération
- `lib/agents/publish-pipeline.ts` — pipeline de publication
- `lib/agents/tracking.ts` — wrapper `withTracking()`

## Séquence de génération

```
Brief utilisateur
    │
    ▼
Account Director (claude-sonnet-4-6)
    — analyse le profil client
    — enrichit le brief avec le contexte HORECA
    — identifie le type de contenu optimal
    │
    ▼
Social Expert (claude-sonnet-4-6)
    — génère la caption (280 chars max pour Instagram)
    — génère 10-15 hashtags pertinents
    — adapte le ton au brandVoice du client
    │
    ▼
Image Generator (gpt-image-1)
    — lit la Direction Artistique du client
    — génère une image cohérente avec l'identité visuelle
    — stocke l'image dans public/uploads/ ou Vercel Blob
    │
    ▼
Supervisor (claude-sonnet-4-6)
    — évalue caption + image
    — verdict : ready / revise / blocked
    — donne des suggestions d'amélioration si revise
    │
    ▼
Post sauvegardé en DB
    statut: 'draft' (ready) ou 'needs_revision' (revise/blocked)
```

## `withTracking()` — Suivi des agents

Chaque étape est wrappée dans `withTracking()` qui :
1. Crée un `agent_job` en DB avant l'exécution
2. Enregistre `agent_events` (start, complete, error) pendant
3. Capture `cost`, `tokensUsed`, `durationMs` après
4. Gère les erreurs selon `onError` callback

```typescript
const result = await withTracking(
  () => runSocialExpert(input),
  { jobId, agent: 'social-expert', sequence: 2, taskLabel: 'Génération du texte' },
  {
    onComplete: r => ({ outputSummary: r.caption.substring(0, 100), cost: r.cost }),
    onError: () => ({ errorMessage: 'Erreur texte non bloquante', errorAction: 'retry' }),
  }
)
```

## Agent Activity Center

`/agents` — liste tous les jobs IA avec leur statut.
`/agents/jobs/[id]` — détail d'un job : events, coût, durée, input/output.
`/clients/[id]/agents` — jobs IA filtrés pour un client.

## Coûts estimés par post

| Agent | Modèle | Coût estimé |
|-------|--------|------------|
| Account Director | claude-sonnet-4-6 | ~$0.006 |
| Social Expert | claude-sonnet-4-6 | ~$0.008 |
| Image Generator | gpt-image-1 | ~$0.030 |
| Supervisor | claude-sonnet-4-6 | ~$0.003 |
| **Total** | | **~$0.047** |

## Pipeline de publication

```
Post approuvé
    │
    ▼
publish-pipeline.ts
    — vérifie que le post est 'approved' ou 'scheduled'
    — re-supervise si demandé
    │
    ▼
meta-publisher.ts
    — Facebook : POST graph.facebook.com/v23.0/me/feed
    — Instagram : POST container → POST publish
    │
    ▼
Post mis à jour en DB
    statut: 'published' (succès) ou 'failed' (erreur)
    platform_post_ids: { facebook: '...', instagram: '...' }
```

## Risque critique C1

Le pipeline est **synchrone** : la route `/api/studio/generate-post` bloque jusqu'à la fin.
Durée typique : 30-90 secondes.
Timeout Vercel : 60 secondes sur les Hobby plans, 900 secondes sur Pro.

**Si le timeout est atteint** : le post n'est pas sauvegardé, l'utilisateur voit une erreur 504.

**Solution planifiée (Phase 4)** :
- Route retourne immédiatement un `jobId`
- Pipeline s'exécute en background (Vercel Background Functions ou queue)
- Frontend poll `/api/agents/jobs/[jobId]` pour suivre la progression
