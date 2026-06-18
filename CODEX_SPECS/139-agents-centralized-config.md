# Spec 139 — Agents : configuration centralisée des modèles et tarifs

## Objectif
Remplacer les chaînes de modèle hardcodées (`'claude-opus-4-7'`, etc.) et les constantes de tarification dupliquées dans chaque agent par un seul fichier `lib/agents/config.ts`. Mettre à jour tous les agents vers `claude-opus-4-8`.

## Problème
- 16+ occurrences de `'claude-opus-4-7'` dans 8 fichiers agents
- Constante `(inputTokens * 5 + outputTokens * 25) / 1_000_000` répétée 7 fois
- `claude-haiku-4-5-20251001` avec suffixe de date incorrect (doit être `claude-haiku-4-5`)
- Tarif haiku incorrect dans `url-reader.ts` ($0.80/$4.00 → $1.00/$5.00)
- Migrer `claude-opus-4-7` → `claude-opus-4-8`

## Solution

### Fichier créé
- `lib/agents/config.ts` — source unique de vérité pour modèles et tarifs

### Fichiers modifiés
- `lib/agents/account-director.ts`
- `lib/agents/social-expert.ts`
- `lib/agents/vision-analyzer.ts`
- `lib/agents/visual-identity.ts`
- `lib/agents/supervisor.ts`
- `lib/agents/performance-analyst.ts`
- `lib/agents/strategy-advisor.ts`
- `lib/agents/launch-advisor.ts`
- `lib/agents/planner.ts`
- `lib/agents/url-reader.ts`
- `lib/agents/page-command-agent.ts`
- `lib/connection-registry.ts`

## Comportement

### Avant
```typescript
// Dans chaque agent
model: 'claude-opus-4-7',
const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000
```

### Après
```typescript
// Dans chaque agent
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'
model: AGENT_MODELS.opus,
const cost = calcCost('opus', inputTokens, outputTokens)
```
