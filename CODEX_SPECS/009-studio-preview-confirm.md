# CODEX_SPECS/009 — Preview fidèle FB/IG + modale de confirmation avant publication

## Context

Audit UX du 2026-06-12 (Mission Architecture Produit V2) — deux risques critiques identifiés :

1. **C1 — La preview Instagram dans `StudioForm.tsx` affiche un placeholder emoji**
   (`aspect-square bg-gradient-to-br ... {clientEmoji}`) au lieu de la vraie image générée
   (`result.post.imageUrl`). Et il n'existe **aucune preview Facebook** — le caption FB est
   affiché en texte brut. L'utilisateur publie à l'aveugle.
2. **C2 — Le bouton "Publier maintenant" dans `PostActions.tsx` publie en un clic**,
   sans récapitulatif ni confirmation. Dans un contexte agence multi-clients HORECA,
   un mauvais clic = une publication live sur la page d'un client.

Fichiers à lire avant de commencer :
- `components/studio/StudioForm.tsx` (le composant `CaptionResult` en bas du fichier)
- `components/posts/PostActions.tsx`
- `types/post.ts` (champs `ctaType`, `ctaUrl`, `imageUrl`, `contentType`, `supervisorReview`)
- `lib/agents/meta-publisher.ts` (constante `META_CTA_TYPES` pour les labels CTA)

**Aucun changement de schéma DB. Aucune nouvelle route API.**

---

## Goal

L'utilisateur voit son post **exactement comme ses abonnés le verront** (FB et IG, vraie
image, CTA rendu), et toute publication immédiate passe par une modale de récapitulatif.

---

## Fichiers à modifier

### 1. `components/studio/StudioForm.tsx`

#### A. Passer l'image réelle à `CaptionResult`

Le composant `CaptionResult` reçoit actuellement `caption`, `clientEmoji`, `clientName`.
Ajouter trois props :

```typescript
function CaptionResult({ caption, clientEmoji, clientName, imageUrl, ctaType, ctaUrl }: {
  caption: GeneratedCaption
  clientEmoji: string
  clientName: string
  imageUrl?: string | null     // result.post.imageUrl
  ctaType?: string | null      // result.post.ctaType
  ctaUrl?: string | null       // result.post.ctaUrl
})
```

Au call site (`result.captions.map(...)`), passer `imageUrl={result.post.imageUrl}`,
`ctaType={result.post.ctaType}`, `ctaUrl={result.post.ctaUrl}`.

#### B. Preview Instagram — vraie image

Dans la branche `caption.platform === 'instagram'`, remplacer le placeholder
`aspect-square bg-gradient-to-br ... {clientEmoji}` par :

```tsx
<div className="aspect-square bg-gray-100 overflow-hidden">
  {imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 flex items-center justify-center text-6xl">
      {clientEmoji}
    </div>
  )}
</div>
```

Ajouter aussi la **troncature IG réaliste** : afficher seulement les 125 premiers
caractères du caption suivis de `... plus` en `text-gray-500` si `caption.caption.length > 125`,
avec un état local `expanded` togglé au clic (comme la vraie app).

#### C. Preview Facebook — nouvelle card

Dans la branche `else` (actuellement texte brut pour FB/TikTok/LinkedIn), si
`caption.platform === 'facebook'`, rendre une card mockup Facebook **fond blanc** :

```
┌──────────────────────────────────────┐
│ [emoji avatar rond] Nom du client    │
│                À l'instant · 🌐      │
│ Caption (troncature à 280 chars +    │
│ "Voir plus" cliquable)               │
│ [IMAGE ratio 1.91:1 object-cover]    │
│ [bandeau CTA gris clair si ctaType : │
│   domaine de ctaUrl  |  [Réserver]]  │
│ 👍 J'aime  💬 Commenter  ↗ Partager  │
└──────────────────────────────────────┘
```

Détails d'implémentation :
- Avatar : `w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800` avec `clientEmoji`.
- Image : `<div className="aspect-[1.91/1] bg-gray-100 overflow-hidden">` + `<img object-cover>`.
  Si pas d'image → ne pas rendre le bloc (post texte).
- Bandeau CTA : rendu **uniquement si `ctaType && ctaUrl`**. Libellé du bouton : chercher
  dans `META_CTA_TYPES` (importer depuis `@/lib/agents/meta-publisher`) le `label`
  correspondant au `value === ctaType`, fallback sur `ctaType`. À gauche du bouton,
  afficher le hostname de `ctaUrl` (utiliser `new URL(ctaUrl).hostname` dans un try/catch,
  fallback chaîne brute) en `text-xs text-gray-500 uppercase`.
  Bouton : `bg-gray-200 text-gray-800 text-sm font-semibold px-4 py-1.5 rounded`.
- Barre actions : texte gris `text-gray-500 text-sm`, séparée par `border-t border-gray-200`.
- Les hashtags FB sont intégrés à la suite du caption (bleu `text-blue-600`), pas en bloc séparé.
- TikTok/LinkedIn : conserver le rendu texte brut actuel (ne rien casser).

### 2. `components/posts/PostActions.tsx`

#### A. Modale de confirmation avant `publishNow()`

Ajouter un état `const [confirming, setConfirming] = useState(false)`.

Le bouton "Publier maintenant" ne déclenche plus `publishNow()` directement : il fait
`setConfirming(true)`. Rendre une modale (overlay `fixed inset-0 z-50 bg-black/70
flex items-center justify-center p-4`) avec une card `bg-gray-900 border border-gray-700
rounded-2xl p-6 max-w-md w-full space-y-4` contenant :

```
⚠️ Confirmer la publication

Plateformes  : {post.platforms.join(' + ')}
Type         : {post.contentType}
Visuel       : {post.imageUrl ? 'Oui' : 'Texte seul'}
CTA          : {post.ctaType ? `${post.ctaType} → ${post.ctaUrl}` : '—'}
Supervisor   : {post.supervisorReview ? `${post.supervisorReview.verdict} (${post.supervisorReview.score}/100)` : 'Non supervisé'}

Cette action publie immédiatement et publiquement sur les comptes du client.

[Annuler]   [Confirmer et publier]
```

Détails :
- Lignes du récap : grid 2 colonnes `text-sm`, label en `text-gray-500`, valeur en `text-gray-200`.
- Si `post.supervisorReview?.verdict === 'revise'` → afficher la ligne Supervisor en amber.
  Si pas de review → ligne en amber avec mention "Non supervisé — recommandé avant publication".
- "Confirmer et publier" : `bg-purple-600 hover:bg-purple-500` ; appelle `publishNow()` puis
  `setConfirming(false)` (fermer la modale avant l'appel, le spinner existant sur le bouton
  principal suffit).
- "Annuler" : `border border-gray-700 text-gray-400 hover:bg-gray-800`.
- Fermer aussi au clic sur l'overlay (`onClick` sur le fond, `stopPropagation` sur la card).

#### B. Ne PAS toucher

- La logique `schedule()` / `unschedule()` reste identique (la planification n'est pas
  une action irréversible, pas de modale).
- `PostSupervisor` et `PublishDueButton` inchangés.

---

## Don't touch

- `lib/agents/*` (aucune logique agent)
- `app/api/**` (aucune route)
- `lib/db/**` (aucun schéma, aucune query)
- Le rendu TikTok/LinkedIn existant dans `CaptionResult`

---

## Validation

```bash
npx tsc --noEmit
npm run build
```

Vérification manuelle : `/studio` → générer un post FB+IG avec image et CTA →
la preview IG montre la vraie image, la preview FB montre la card avec bandeau CTA →
cliquer "Publier maintenant" ouvre la modale → "Annuler" ferme sans publier.

## Output expected

Résumé des fichiers modifiés + capture des cas gérés (image présente/absente,
CTA présent/absent, review présente/absente).
