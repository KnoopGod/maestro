# Spec 098 — Usage : liens posts avec contexte "from=usage"

## Objectif
Les posts de la section "Activité récente" de la page Usage & Coûts utilisent `?from=usage`, ce qui affiche "← Usage & Coûts" dans le breadcrumb du détail de post.

## Comportement

### Avant
- Cliquer sur un post depuis Usage → breadcrumb "← Validation" (contexte par défaut)

### Après
- Cliquer sur un post depuis Usage → breadcrumb "← Usage & Coûts" → `/usage`

## Implémentation
- `FromContext` étendu : `'usage'` ajouté
- `FROM_CFG` : `usage: { label: 'Usage & Coûts', href: '/usage', ... }`
- Tableau de validation mis à jour

## Fichiers modifiés
- `app/posts/[id]/page.tsx` — FromContext + FROM_CFG + validation array
- `app/usage/page.tsx` — `?from=usage` sur les liens post
