# CODEX_SPECS/010 — Récupération d'erreur guidée après échec de publication

## Context

Audit UX du 2026-06-12 (Mission Architecture Produit V2) — problème C3 :

Quand une publication Meta échoue, l'utilisateur voit un message technique brut
(ex. `[Facebook] Token Meta expiré ou invalide. Régénère un User Access Token...`)
dans `PostActions.tsx` et dans `/plan` (ligne ~221 de `app/plan/page.tsx`).
Il n'y a **aucune action contextuelle cliquable** : pas de lien vers
`/clients/[id]/connections` pour une erreur token, pas de lien vers la Library
pour une erreur image. L'utilisateur doit deviner où aller.

Les messages d'erreur sont déjà enrichis côté serveur par `decorateMetaError()`
dans `lib/agents/publish-pipeline.ts` — chaque catégorie d'erreur a un pattern
stable dans le message (`#200`, `#190`, `#100`, `Token Meta expiré`,
`CODEXRS_PUBLIC_URL`, `non connecté`). On peut donc mapper côté client.

Fichiers à lire avant de commencer :
- `lib/agents/publish-pipeline.ts` (fonction `decorateMetaError` — les patterns exacts)
- `components/posts/PostActions.tsx` (bloc d'affichage `error`)
- `app/plan/page.tsx` (bloc `post.status === 'failed' && post.error`)

**Aucun changement de schéma DB. Aucune route API. Aucun changement serveur.**

---

## Goal

Chaque erreur de publication affichée dans l'UI est accompagnée d'une **action
prescrite cliquable** qui amène l'utilisateur directement sur l'écran de résolution.

---

## Fichiers à créer

### 1. `lib/meta-error-actions.ts` (nouveau, ~60 lignes)

Module **sans dépendance React** (utilisable en Server et Client Components) :

```typescript
export interface MetaErrorAction {
  /** Libellé court du problème, en français. */
  label: string
  /** Action recommandée, en français. */
  hint: string
  /** Lien de résolution. `{clientId}` est substitué par l'appelant via buildHref. */
  href: (clientId: string) => string
  /** Texte du bouton/lien. */
  cta: string
}

export function resolveMetaErrorAction(error: string): MetaErrorAction | null
```

Table de correspondance (tester les patterns **dans cet ordre**, retourner le premier match) :

| Pattern (regex insensible à la casse sur `error`) | label | hint | href | cta |
|---|---|---|---|---|
| `#190\|token.*(expiré\|invalide\|expired\|invalid)` | `Token Meta expiré` | `Le jeton d'accès du client n'est plus valide. Reconnecte la page Facebook depuis l'écran Connexions.` | `/clients/${clientId}/connections` | `Reconnecter Meta →` |
| `#200\|pages_manage_posts` | `Permissions insuffisantes` | `Le token n'a pas les permissions de publication. Lance le diagnostic pour voir les scopes manquants.` | `/clients/${clientId}/connections` | `Diagnostiquer le token →` |
| `non connecté` | `Compte non connecté` | `Ce client n'a pas de compte Meta relié pour cette plateforme.` | `/clients/${clientId}/connections` | `Connecter le compte →` |
| `CODEXRS_PUBLIC_URL\|localhost\|image publiquement accessible` | `Image inaccessible pour Meta` | `Meta ne peut pas télécharger le visuel. Vérifie CODEXRS_PUBLIC_URL ou choisis un asset public de la Library.` | `/clients/${clientId}/library` | `Ouvrir la Library →` |
| `#100\|Invalid parameter` | `Paramètre rejeté par Meta` | `Souvent une URL d'image invalide ou un CTA mal formé. Vérifie le visuel et l'URL du bouton d'action.` | `/clients/${clientId}/connections` | `Vérifier la connexion →` |
| `Supervisor blocked` | `Bloqué par le Supervisor` | `Le contenu a été jugé à risque. Ouvre le post pour lire le verdict et corriger.` | `/studio?client=${clientId}` | `Réviser le post →` |

Si aucun pattern ne matche → retourner `null` (l'UI affiche alors l'erreur brute
comme aujourd'hui, sans bouton).

### 2. `components/posts/PublishErrorHint.tsx` (nouveau, ~40 lignes)

Composant **serveur-compatible** (pas de `'use client'`, pas de hooks) :

```typescript
export function PublishErrorHint({ error, clientId }: { error: string; clientId: string })
```

Rendu :
- Appelle `resolveMetaErrorAction(error)`.
- Si match : bloc `bg-red-950/30 border border-red-700/30 rounded-lg p-3 space-y-1.5` avec
  - ligne 1 : `⚠ {label}` en `text-sm font-medium text-red-300`
  - ligne 2 : `{hint}` en `text-xs text-red-400/80`
  - ligne 3 : `<a href={action.href(clientId)}>` en `text-xs text-purple-300 hover:underline font-medium` avec `{cta}`
  - ligne 4 (repliée) : `<details>` avec `<summary>Détails techniques</summary>` et l'erreur
    brute en `text-[10px] text-gray-600 font-mono break-all`
- Si pas de match : fallback identique à l'affichage actuel (bloc rouge avec erreur brute).

---

## Fichiers à modifier

### 3. `components/posts/PostActions.tsx`

Remplacer le bloc d'affichage `{error && (...)}` par `<PublishErrorHint error={error}
clientId={post.clientId} />`. Le bloc `warning` (amber) reste inchangé.

### 4. `app/plan/page.tsx`

Dans le bloc `post.status === 'failed' && post.error` (~ligne 221), remplacer
l'affichage brut par `<PublishErrorHint error={post.error} clientId={post.clientId} />`.

---

## Don't touch

- `lib/agents/publish-pipeline.ts` — `decorateMetaError()` reste la source des messages.
  **Ne pas modifier ses textes** (les patterns de `resolveMetaErrorAction` en dépendent).
- `app/api/**`, `lib/db/**`

---

## Validation

```bash
npx tsc --noEmit
npm run build
```

Test rapide des patterns (à exécuter et coller le résultat dans le résumé) :

```bash
npx tsx -e "
import { resolveMetaErrorAction } from './lib/meta-error-actions'
const cases = [
  '[Facebook] Token Meta expiré ou invalide. Régénère un User Access Token',
  '[Facebook] Erreur permissions Meta (#200).',
  'Facebook non connecté pour ce client',
  \"Instagram non publié : l'API Instagram exige une image publiquement accessible. Configure CODEXRS_PUBLIC_URL\",
  '[Instagram] Paramètre invalide (souvent : URL image inaccessible depuis Meta).',
  'Supervisor blocked: ton trop promotionnel',
  'Erreur réseau inconnue xyz',
]
for (const c of cases) console.log(JSON.stringify(resolveMetaErrorAction(c)?.label ?? null), '←', c.slice(0, 50))
"
```

Attendu : les 6 premiers matchent leur catégorie, le dernier retourne `null`.

## Output expected

Résumé des fichiers créés/modifiés + sortie du test des patterns.
