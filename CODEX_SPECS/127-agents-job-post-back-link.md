# Spec 127 — Agent job → post : breadcrumb retour vers le job source

## Objectif
Quand l'utilisateur navigue d'un job d'agent vers le post généré, le breadcrumb du post doit pointer vers le job d'origine (avec son filtre client), pas vers la liste générique `/agents`.

## Comportement

### Avant
- Lien dans job detail : `/posts/{postId}?from=agents`
- Breadcrumb post detail : "← Agents" → `/agents`
- Le filtre client actif et le job lui-même étaient perdus

### Après
- Lien dans job detail : `/posts/{postId}?from=agents&agentsBack=%2Fagents%2Fjobs%2F{jobId}%3Fclient%3D{clientId}`
- Breadcrumb post detail : "← Agents" → `/agents/jobs/{jobId}?client={clientId}`
- Titre au survol : "Retour au détail du job"
- Paramètre `agentsBack` propagé dans la navigation prev/next

## Fichiers modifiés
- `app/agents/jobs/[id]/page.tsx` — lien post enrichi avec `agentsBack`
- `app/posts/[id]/page.tsx` — lit `agentsBack`, construit `agentsHref`, cas `fromCtx === 'agents'`, propagation dans prev/next
