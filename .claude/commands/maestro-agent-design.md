---
description: Vérifie qu'un agent IA MAESTRO respecte les standards du projet (input/output typés, coût, durée, erreur, prompt versionné).
---

# Vérification design d'agent IA — MAESTRO

Vérifie qu'un agent respecte les standards MAESTRO.

## Checklist de conformité agent

### Responsabilité unique
- [ ] L'agent a un nom qui décrit précisément sa responsabilité
- [ ] Il ne fait qu'une chose (pas de logique UI, pas de requête DB directe)

### Typage TypeScript
- [ ] Interface d'input définie et exportée
- [ ] Interface d'output définie et exportée
- [ ] Pas de `any` injustifié

### Tracking des coûts
- [ ] `cost` retourné dans l'output (en USD)
- [ ] `tokensUsed` retourné dans l'output
- [ ] `model` retourné dans l'output

### Tracking de durée
- [ ] L'agent est wrappé dans `withTracking()` quand appelé depuis le pipeline
- [ ] `taskLabel` descriptif pour l'Agent Activity Center

### Gestion des erreurs
- [ ] Les erreurs non bloquantes sont catchées et ne font pas échouer le pipeline
- [ ] Les erreurs bloquantes sont propagées correctement
- [ ] `onError` callback fourni à `withTracking()` si l'agent est non bloquant

### Parsing des réponses JSON
- [ ] Utilise le pattern try/catch + fallback regex pour les réponses Claude
- [ ] Gère le cas où Claude wrap du JSON dans des blocs markdown

### Version du prompt
- [ ] La version du prompt est commentée dans le code si le prompt a évolué
- [ ] Exemple : `// Prompt v2.1 — ajout de la contrainte de longueur 280 chars`

## Template d'agent conforme

```typescript
// lib/agents/mon-agent.ts

export interface MonAgentInput {
  // Input typé
}

export interface MonAgentOutput {
  // Output typé
  cost: number
  tokensUsed: number
  model: string
}

// Prompt v1.0
const SYSTEM_PROMPT = `...`

export async function runMonAgent(input: MonAgentInput): Promise<MonAgentOutput> {
  // Appel API externe
  // Parsing avec fallback regex si Claude
  // Retour structuré
}
```

## Intégration dans le pipeline

```typescript
// Dans pipeline.ts
const result = await withTracking(
  () => runMonAgent(input),
  { jobId, agent: 'mon-agent', sequence: N, taskLabel: 'Description visible dans l\'UI' },
  {
    onComplete: r => ({ outputSummary: `Résumé`, cost: r.cost }),
    onError: () => ({ errorMessage: 'Erreur non bloquante', errorAction: 'retry' }),
  }
)
```
