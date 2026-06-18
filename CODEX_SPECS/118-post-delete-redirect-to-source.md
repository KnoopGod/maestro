# Spec 118 — Post detail : redirection vers la page source après suppression

## Objectif
Quand l'utilisateur supprime un post depuis sa page de détail, il est redirigé vers la page d'où il venait (plan, validation, calendrier, etc.) plutôt que d'obtenir une 404 suite au `router.refresh()` sur un post inexistant.

## Comportement

### Avant
- `PostDeleteButton` appelait `router.refresh()` après suppression
- Sur la page de détail, le post n'existant plus, Next.js appelait `notFound()` → page 404

### Après
- `PostDeleteButton` accepte `redirectTo?: string`
- Quand fourni, `router.push(redirectTo)` est utilisé au lieu de `router.refresh()`
- La page de détail passe `breadcrumb.href` comme `redirectTo` → retour au contexte d'origine avec les filtres préservés

## Fichiers modifiés
- `components/posts/PostActions.tsx` — `PostDeleteButton` avec prop `redirectTo?`
- `app/posts/[id]/page.tsx` — `redirectTo={breadcrumb.href}` passé à `PostDeleteButton`
