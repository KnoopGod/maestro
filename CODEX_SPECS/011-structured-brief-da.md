# CODEX_SPECS/011 — Brief structurée (4 champs) + capsule Direction Artistique active

## Context

Audit UX du 2026-06-12 (Mission Architecture Produit V2) — problèmes H1 et H4 :

1. **H1 — La brief est un textarea libre.** L'utilisateur écrit "promo brunch weekend",
   l'agent improvise. Le champ ne guide pas vers ce qui produit de bons outputs
   (objectif, ton, contrainte à inclure). Les `BRIEF_TEMPLATES` existants aident mais
   ne structurent pas.
2. **H4 — La DA (différenciateur clé de CODEXRS) est invisible dans le Studio.**
   Au moment de générer, l'utilisateur ne sait pas si une Direction Artistique est
   configurée pour ce client ni ce qu'elle contient.

Fichiers à lire avant de commencer :
- `components/studio/StudioForm.tsx` (état `brief`, `BRIEF_TEMPLATES`, `handleGenerate`)
- `lib/agents/social-expert.ts` (comment `brief` entre dans le prompt — **ne pas modifier ce fichier**)
- `lib/db/queries/*` — trouver la query d'identité visuelle (`getVisualIdentity` ou équivalent,
  probablement dans un fichier dédié ; chercher `client_visual_identity`)
- `app/clients/[id]/studio/page.tsx` et `app/studio/page.tsx` (les pages serveur qui montent `StudioForm`)

**Aucun changement de schéma DB. Le format de `brief` envoyé à l'API reste une string**
(on compose les 4 champs en une brief texte riche — zéro changement côté agents).

---

## Goal

L'utilisateur remplit 4 champs guidés au lieu d'un textarea libre, voit en permanence
si la DA du client est active, et l'agent reçoit une brief mieux structurée — sans
toucher au contrat de l'API ni aux agents.

---

## Fichiers à modifier

### 1. `components/studio/StudioForm.tsx`

#### A. Nouveaux états (remplacent l'usage direct de `brief` dans le formulaire)

```typescript
const [subject, setSubject] = useState('')        // pré-rempli depuis initialPost?.brief ou initialPillar
const [objective, setObjective] = useState<'' | 'reservation' | 'engagement' | 'notoriete' | 'promo'>('')
const [tone, setTone] = useState<'auto' | 'chaleureux' | 'premium' | 'fun'>('auto')
const [mustInclude, setMustInclude] = useState('')
```

Conserver l'état `brief` existant comme **valeur dérivée** au moment du submit
(voir §C) — ne pas le supprimer si d'autres usages existent (ex. `PostIdeasPanel`,
templates). Les `BRIEF_TEMPLATES` écrivent désormais dans `subject`.

#### B. UI du formulaire

Remplacer le textarea brief par :

1. **Sujet** — input texte une ligne, placeholder
   `Ex : Promo petit-déjeuner "Sunrise Brunch" ce weekend`. Requis.
2. **Objectif principal** — 4 boutons radio-pills sur une ligne :
   `🎯 Réservations` / `💬 Engagement` / `📣 Notoriété` / `🏷 Promo`.
   Style : pill `border border-gray-700 text-gray-400`, sélectionné →
   `border-purple-600 bg-purple-950/40 text-purple-300`. Optionnel (aucun sélectionné = ok).
3. **Ton** — select ou pills : `Auto (suit la DA)` (défaut) / `Chaleureux` /
   `Professionnel & premium` / `Fun & décalé`.
4. **À inclure absolument** — input texte une ligne, optionnel, placeholder
   `Ex : prix 490 ฿, mention "buffet inclus"`.

Le bouton "Générer" est `disabled` si `subject.trim()` est vide (en plus des
conditions existantes).

#### C. Composition de la brief au submit

Dans `handleGenerate`, construire la string envoyée à l'API :

```typescript
const OBJECTIVE_LABELS: Record<string, string> = {
  reservation: 'générer des réservations',
  engagement: "maximiser l'engagement (commentaires, partages)",
  notoriete: 'développer la notoriété de la marque',
  promo: 'promouvoir une offre spéciale',
}
const TONE_LABELS: Record<string, string> = {
  chaleureux: 'chaleureux et intime',
  premium: 'professionnel et premium',
  fun: 'fun et décalé',
}

const composedBrief = [
  subject.trim(),
  objective ? `Objectif : ${OBJECTIVE_LABELS[objective]}.` : '',
  tone !== 'auto' ? `Ton souhaité : ${TONE_LABELS[tone]}.` : '',
  mustInclude.trim() ? `À inclure impérativement : ${mustInclude.trim()}.` : '',
].filter(Boolean).join('\n')
```

Envoyer `composedBrief` à la place de `brief` dans le body du fetch.
Quand un draft existant est chargé (`initialPost`), pré-remplir `subject` avec
`initialPost.brief` (la brief composée historique) — pas besoin de la re-décomposer.

#### D. Capsule DA active

`StudioForm` reçoit une nouvelle prop optionnelle :

```typescript
visualIdentity?: { stylePrompt: string; mood?: string | null } | null
```

Rendu juste sous le sélecteur de client (toujours visible) :

- **DA configurée** : bloc `bg-emerald-950/20 border border-emerald-700/30 rounded-xl p-3` :
  - `✓ Direction Artistique active` en `text-xs font-medium text-emerald-300`
  - première phrase du `stylePrompt` (couper à 140 chars + `…`) en `text-xs text-gray-400 italic`
- **DA absente** : bloc amber `bg-amber-950/20 border border-amber-700/30` :
  - `⚠ Aucune Direction Artistique` en `text-xs font-medium text-amber-300`
  - `Les visuels seront génériques. Analyse des photos du client dans la Library pour créer sa DA.`
  - lien `<a href={`/clients/${clientId}/library`}>` `Configurer la DA →` en `text-xs text-purple-300 hover:underline`

Si l'utilisateur change de client dans le select (page `/studio` globale), fetch
`/api/clients/${clientId}/visual-identity` si cette route existe ; **si elle n'existe
pas, créer** `app/api/clients/[id]/visual-identity/route.ts` (GET) qui retourne
`{ identity: { stylePrompt, mood } | null }` via la query DB existante.

### 2. `app/clients/[id]/studio/page.tsx` et `app/studio/page.tsx`

Charger l'identité visuelle côté serveur pour le client initial
(`getVisualIdentity(clientId)` — adapter au nom réel de la query) et passer
`visualIdentity` à `<StudioForm />`. Sur `/studio` global sans client présélectionné,
passer `null` (le fetch client prendra le relais au premier changement de select).

---

## Don't touch

- `lib/agents/social-expert.ts` — la brief reste une string, l'injection DA dans le
  prompt existe déjà côté agent.
- `app/api/studio/generate-post/route.ts` — le contrat `{ brief: string }` ne change pas.
- `lib/db/schema.ts`, migrations.
- `PostIdeasPanel` — s'il écrit dans la brief, le brancher sur `setSubject`.

---

## Validation

```bash
npx tsc --noEmit
npm run build
```

Vérification manuelle : `/clients/[id]/studio` → la capsule DA s'affiche (verte si DA,
amber sinon) → remplir les 4 champs → générer → le post produit reflète l'objectif
et la contrainte "à inclure".

## Output expected

Résumé des fichiers modifiés/créés, le nom exact de la query d'identité visuelle
utilisée, et un exemple de `composedBrief` généré.
