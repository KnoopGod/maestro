# Spec 099 — Polish : contextes breadcrumb manquants + priorité brief

## Objectif
Compléter les contextes `from=` manquants dans les liens vers les posts et uniformiser
l'affichage du `brief` avant la `caption` dans toutes les listes de posts.

## Changements

### UpcomingPostRow (fiche client)
- Affiche `post.brief || post.caption.substring(0, 60)` (cohérent avec RecentPostRow)

### Agents job detail → post
- Lien "Voir le post généré" utilisait `from=validation` → corrigé en `from=agents`
- Nouveau contexte `agents` dans `FromContext` : "← Agents" → `/agents`

## FromContext exhaustif (post detail)
```
validation | plan | calendar | dashboard | client | search | usage | agents
```

## Fichiers modifiés
- `app/clients/[id]/page.tsx` — UpcomingPostRow : brief || caption
- `app/posts/[id]/page.tsx` — FromContext + FROM_CFG + validation array
- `app/agents/jobs/[id]/page.tsx` — `from=agents`
