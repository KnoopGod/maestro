# CODEX_SPECS/008 — Améliorations P1 agents : contexte temporel + format suggéré + hook variants

## Context

Audit agents du 2026-06-09 — trois lacunes P1 identifiées :

1. **Account Director** ignore la date/heure d'exécution → rate les opportunités hebdomadaires et saisonnières
   (jeudi = driver week-end, Saint-Valentin J-5, Noël en novembre)
2. **Social Expert** génère un seul hook par caption → aucun choix pour l'utilisateur,
   or le hook est la variable la plus impactante sur l'engagement
3. **Social Expert** ne suggère pas le format optimal → carrousel si brief = liste/multi-produit,
   reel si brief = mouvement/ambiance

**Aucun changement de schéma DB. Aucune nouvelle table.**

Ce spec est complémentaire aux system prompts du spec 005 (ne pas écraser les system prompts).

---

## Fichiers à modifier

### 1. `lib/agents/account-director.ts`

#### A. Ajouter `runAt` au type d'input

```typescript
export async function runAccountDirector(input: {
  client: Client
  userBrief?: string
  recentPosts?: Post[]
  topPosts?: Post[]
  runAt?: string   // ← nouveau : ISO datetime ex. "2026-06-09T14:23:00Z"
}): Promise<{
  directive: AccountDirective
  cost: number
  tokensUsed: number
  model: string
}>
```

#### B. Dériver les signaux temporels

Juste après `const topPosts = input.topPosts ?? []`, ajouter :

```typescript
const now = input.runAt ? new Date(input.runAt) : new Date()
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                     'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const dayOfWeek = DAY_NAMES[now.getDay()]
const monthName = MONTH_NAMES[now.getMonth()]
const dayOfMonth = now.getDate()
const temporalSignals = getTemporalSignals(now.getDay(), now.getMonth(), dayOfMonth)
```

#### C. Ajouter `# CONTEXTE TEMPOREL` dans le userPrompt

Insérer juste **avant** `# BRIEF UTILISATEUR` :

```typescript
# CONTEXTE TEMPOREL

**Jour :** ${dayOfWeek} ${dayOfMonth} ${monthName}
**Signaux à exploiter :**
${temporalSignals}
```

#### D. Ajouter la fonction `getTemporalSignals` (avant `parseDirective`)

```typescript
function getTemporalSignals(dayIndex: number, month: number, dayOfMonth: number): string {
  const signals: string[] = []

  // Signaux hebdomadaires
  if (dayIndex === 4 || dayIndex === 5) {
    signals.push('FENÊTRE WEEK-END : priorité CTAs réservation, posts bar/cocktail, drive traffic')
  }
  if (dayIndex === 1 || dayIndex === 2) {
    signals.push('DÉBUT SEMAINE : contenu engagement prioritaire (coulisses, équipe, storytelling)')
  }
  if (dayIndex === 3) {
    signals.push('MILIEU SEMAINE : hôtels/B&B — les réservations week-end se décident maintenant')
  }

  // Signaux mensuels / saisonniers (month = 0-11)
  if (month === 0 && dayOfMonth <= 15) {
    signals.push('Galette des rois / post-fêtes — contenu léger, retour au quotidien')
  }
  if ((month === 0 && dayOfMonth >= 25) || (month === 1 && dayOfMonth <= 10)) {
    signals.push('SAINT-VALENTIN en approche — préparer menus et offres couples dès maintenant')
  }
  if (month === 1 && dayOfMonth >= 11 && dayOfMonth <= 18) {
    signals.push('SAINT-VALENTIN cette semaine — urgence maximale, dernières places disponibles')
  }
  if (month === 2 || (month === 3 && dayOfMonth <= 15)) {
    signals.push('Printemps / terrasses — premier rosé, légumes primeurs, Pâques en approche')
  }
  if ((month === 3 && dayOfMonth >= 16) || month === 4) {
    signals.push('Mai / début été — Fête des Pères, terrasses, rosé, légèreté')
  }
  if (month === 5 || month === 6 || month === 7) {
    signals.push('Plein été — légèreté, mocktails, sorbets, plats froids, clientèle touristique')
  }
  if ((month === 7 && dayOfMonth >= 20) || month === 8) {
    signals.push('Rentrée — habitués de retour, plats mijotés, retour de saison')
  }
  if (month === 9) {
    signals.push('Automne — champignons, châtaignes, premiers feux de cheminée, Toussaint')
  }
  if (month === 10 && dayOfMonth <= 15) {
    signals.push('Beaujolais Nouveau bientôt (3ème jeudi) + NOËL : commencer les menus de réveillon')
  }
  if (month === 10 && dayOfMonth >= 16) {
    signals.push('NOËL EN APPROCHE : menus réveillons, cadeaux gastronomiques, dernières places')
  }
  if (month === 11) {
    signals.push('RÉVEILLON / FÊTES : urgence maximale, content de dernière minute, ambiance festive')
  }

  return signals.length > 0
    ? signals.map(s => `- ${s}`).join('\n')
    : '- Période standard — choisir le pilier selon l\'alternance stratégique et l\'historique récent.'
}
```

---

### 2. `lib/agents/social-expert.ts`

#### A. Mettre à jour l'interface `GeneratedCaption`

```typescript
export interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  hookVariants: string[]                             // ← nouveau : 2 hooks alternatifs
  cta: string
  characterCount: number
  suggestedFormat: 'post' | 'carousel' | 'reel'     // ← nouveau
  formatRationale?: string                           // ← nouveau : 1 phrase expliquant le format
}
```

#### B. Ajouter dans le `systemPrompt`, juste avant `## Ce que tu ne fais jamais`

Note : si le spec 005 a déjà été appliqué, insérer cette section dans le systemPrompt existant de spec 005 (qui est plus long). Sinon insérer avant `\n\n**Format de sortie : JSON strict, sans markdown.**`

```
### Format de contenu à recommander
- **post** : sujet focal unique (un plat, un moment, un portrait, une ambiance)
- **carousel** : brief implique une liste, une progression, un avant/après, un multi-produits (4-8 slides)
- **reel** : brief implique du mouvement, une action visible, une recette en étapes, une ambiance sonore
Toujours renseigner `suggestedFormat` et justifier en 1 phrase dans `formatRationale`.
```

#### C. Mettre à jour le format JSON dans le userPrompt (section `# TÂCHE`)

Remplacer le bloc d'exemple JSON par :

```typescript
{
  "reasoning": "Bref raisonnement (1-2 phrases) sur l'angle stratégique choisi pour ce post",
  "captions": [
    {
      "platform": "instagram",
      "caption": "Le texte complet à publier (sans les hashtags)",
      "hashtags": ["hashtag1", "hashtag2", "..."],
      "hook": "Le hook principal retenu — le plus fort",
      "hookVariants": [
        "Variante A — ton plus direct ou plus sensoriel",
        "Variante B — ton plus émotionnel ou narratif"
      ],
      "cta": "Le call-to-action utilisé",
      "suggestedFormat": "post",
      "formatRationale": "Post simple — un seul sujet focal, pas de liste ou de progression."
    }
  ]
}
```

#### D. Normaliser les nouveaux champs dans le mapping final

Remplacer :

```typescript
const captionsWithCount: GeneratedCaption[] = parsed.captions.map(c => ({
  ...c,
  characterCount: c.caption.length,
}))
```

par :

```typescript
const VALID_FORMATS = ['post', 'carousel', 'reel'] as const
const captionsWithCount: GeneratedCaption[] = parsed.captions.map(c => ({
  ...c,
  hookVariants: Array.isArray(c.hookVariants) ? c.hookVariants.slice(0, 2) : [],
  suggestedFormat: VALID_FORMATS.includes(c.suggestedFormat as typeof VALID_FORMATS[number])
    ? (c.suggestedFormat as typeof VALID_FORMATS[number])
    : 'post',
  formatRationale: typeof c.formatRationale === 'string' ? c.formatRationale : undefined,
  characterCount: c.caption.length,
}))
```

---

### 3. `lib/agents/pipeline.ts`

**Passer `runAt` à Account Director** (modifier l'appel existant) :

```typescript
const account = await track(
  () => runAccountDirector({
    client,
    userBrief,
    recentPosts: allRecentForAD,
    topPosts,
    runAt: new Date().toISOString(),
  }),
  ...
)
```

---

## Ne pas toucher

- `supervisor.ts`, `performance-analyst.ts`, `image-generator.ts`
- `lib/db/` — aucun changement de schéma
- Les `systemPrompt` dans leur intégralité (spec 005 les gère)
- Les routes API

---

## Validation

```bash
npx tsc --noEmit
npm run build
```

Vérifier que :
- `GeneratedCaption.hookVariants` est toujours un array non-undefined après le mapping
- `GeneratedCaption.suggestedFormat` est toujours l'une des 3 valeurs autorisées
- `getTemporalSignals` retourne toujours une string non-vide (le cas default est couvert)
- L'appel `runAccountDirector` dans `pipeline.ts` passe bien `runAt`

---

## Output expected

Un seul commit :
```
feat: P1 agents — contexte temporel Account Director, hookVariants + suggestedFormat Social Expert
```

Push sur `claude/maestro-project-handoff-L67ha`.
**Ne pas merger sur main** — Bradley valide le diff.
