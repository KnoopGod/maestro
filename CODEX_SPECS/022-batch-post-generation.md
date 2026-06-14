# Spec 022 — Batch Post Generation

## Contexte

Aujourd'hui, le Studio génère un post à la fois. Pour une agence HORECA gérant 10+ clients,
créer une semaine de contenu (5 posts × 1 client) prend 5 passages manuels dans le Studio.

Cette spec introduit la **génération en lot** : sélectionner un client, choisir un nombre
de posts (3, 5 ou 7), et lancer la génération de tout le plan en une seule action.
Chaque post est tracké individuellement. Les posts atterrissent en Validation comme d'habitude.

## User Story

> En tant qu'agent HORECA, je veux générer une semaine de contenu pour un client
> en un clic, afin de préparer 5 posts distincts (par pilier) sans passer 5 fois par le Studio.

## Comportement attendu

1. L'utilisateur ouvre `/studio/batch`
2. Il sélectionne un client, le nombre de posts (3 / 5 / 7), la plateforme et le type de contenu
3. Il clique **Générer le plan**
4. Le Planner IA propose N idées distinctes (une par pilier)
5. N pipelines sont lancés en parallèle (chacun tracké par un jobId)
6. Un panneau de progression live montre l'avancement de chaque post
7. Quand tous sont terminés, un résumé + bouton vers Validation

## Architecture

### API — `/api/studio/batch-generate` (POST)

**Input** :
```json
{
  "clientId": "...",
  "count": 5,
  "platforms": ["instagram", "facebook"],
  "contentType": "photo",
  "skipImage": false
}
```

**Comportement** :
1. Charge le client
2. Appelle `proposePostIdeas(client, count)` → N idées
3. Pour chaque idée, crée un `AgentJob` + lance `runPostPipeline()` via `after()`
4. Répond immédiatement avec `{ jobIds, ideas }`

**Output** :
```json
{
  "jobIds": ["abc", "def", ...],
  "ideas": [{ "title": "...", "pillar": "...", "brief": "..." }, ...]
}
```

### UI — `/studio/batch`

`BatchStudioForm` (client component) :
- Sélecteur de client
- Sélecteur de count (3 / 5 / 7)
- Sélecteur de plateforme(s)
- Type de contenu
- Toggle "Sans image" (génération texte seul plus rapide)
- Bouton "Générer le plan"

Après submit :
- Panel de N cartes (une par post)
- Chaque carte poll son jobId et affiche la progression des 4 agents
- Quand toutes terminées : CTA vers /validation

## Contraintes

- Max 7 posts par lot (éviter les timeouts Vercel / coûts IA excessifs)
- Les pipelines sont lancés avec `after()` pour libérer la réponse HTTP immédiatement
- Le Planner IA diversifie automatiquement les piliers — pas de redite
- Si un pipeline échoue, les autres continuent (tolérance aux erreurs partielles)
- Pas de nouveau concept "batch_job" — on réutilise AgentJob existant

## Fichiers créés / modifiés

- `CODEX_SPECS/022-batch-post-generation.md` (ce fichier)
- `app/api/studio/batch-generate/route.ts` (nouveau)
- `app/studio/batch/page.tsx` (nouveau)
- `components/studio/BatchStudioForm.tsx` (nouveau)
