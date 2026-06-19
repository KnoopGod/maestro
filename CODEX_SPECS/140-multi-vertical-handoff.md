# SPEC 140 — Handoff : Multi-vertical Growth Cockpit

> **Branche active :** `claude/maestro-project-handoff-L67ha`
> **Dernier commit :** `aac4636` — feat: multi-vertical growth cockpit
> **Date :** 2026-06-19
> **Statut :** Phase 1 complète ✅ — Phase 2 (client onboarding UX) à faire

---

## Ce qui a été livré dans cette session

### Spec 139 — Configuration centralisée des agents ✅
- **`lib/agents/config.ts`** créé : `AGENT_MODELS` (opus/sonnet/haiku/image) + `calcCost()`
- Tous les agents migrés de `claude-opus-4-7` vers `claude-opus-4-8`
- Plus aucun model string ni calcul de coût hardcodé dans les agents

### Playbooks verticaux ✅ (`lib/playbooks/`)
11 fichiers créés :

| Fichier | Vertical | Expertise |
|---|---|---|
| `restaurant.ts` | Restaurant | Timing 11h/17h30, hiérarchie visuelle, CTAs réservation |
| `hotel.ts` | Hôtel | Anti-OTA, chambre mise en scène, saisonnalité |
| `bnb.ts` | Chambre d'hôte | Hôte comme produit, 80% émotionnel, DMs |
| `bar.ts` | Bar | FOMO, timing impulsion, cocktail sensoriel |
| `coiffeur.ts` | Coiffeur | Avant/après, créneaux comme contenu |
| `salle-de-sport.ts` | Salle de sport | Janvier/septembre critiques, essai gratuit |
| `padel.ts` | Padel | Disponibilités temps réel, afterwork, indoor |
| `commerce-local.ts` | Commerce local | Anti-Amazon, arrivages comme événements |
| `default.ts` | Fallback générique | Principes universels commerce physique |
| `index.ts` | Registry | `getPlaybook()`, `getAllPlaybooks()`, `VERTICAL_LABELS` |
| `types.ts` | Interfaces | `VerticalPlaybook`, `CampaignTemplate` — imports depuis `@/types/client` |

**Chaque playbook contient :**
- `promptContext` : bloc dense injecté dans le system prompt des agents
- `contentPillars` : 7-8 piliers spécifiques au vertical
- `campaignTemplates` : 3-4 templates de campagne avec `briefTemplate`
- `primaryKpis` : 5 KPIs business mesurables
- `commonMistakes` : 7-8 erreurs terrain fréquentes
- `peakDays`, `offDays`, `bestPostingTimes`, `peakSeasons`, `offSeasons`

### Types & DB ✅
- **`types/client.ts`** enrichi :
  - `BusinessObjective` : 12 valeurs (fill_slow_days, increase_bookings, sell_offer, sell_membership, promote_event, get_google_reviews, increase_dms, increase_calls, reduce_platform_dependency, attract_new_customers, increase_visibility, increase_revenue_period)
  - `ConversionChannel` : 10 valeurs (phone, whatsapp, instagram_dm, facebook_dm, website, online_booking, booking_platform, google_maps, email, walk_in)
  - `ClientBusinessProfile` interface
  - `BUSINESS_OBJECTIVE_LABELS` et `CONVERSION_CHANNEL_LABELS` pour l'UI
  - `businessProfile: ClientBusinessProfile | null` ajouté à `Client`
- **Migration 009** : `ALTER TABLE clients ADD COLUMN business_profile TEXT` (additive, nullable)
- **`lib/db/queries/clients.ts`** : parse/persist `business_profile` JSON dans tous les CRUD

### Agents enrichis ✅
- **`account-director.ts`** :
  - Rebaptisé "Business Growth Director"
  - Accepte `businessObjective?: BusinessObjective`
  - Injecte `playbook.promptContext` dans le system prompt
  - Section `PROFIL BUSINESS` + `OBJECTIF BUSINESS PRIORITAIRE` dans le user prompt
  - Import corrigé (suppression du `import type` incorrect sur `BUSINESS_OBJECTIVE_LABELS`)
- **`social-expert.ts`** :
  - Importe `getPlaybook` depuis `@/lib/playbooks`
  - Injecte `playbook.promptContext` dans le system prompt (section "Expertise spécifique")
  - Mise à jour du titre (plus HORECA-only dans la description)
- **`pipeline.ts`** :
  - Accepte `businessObjective?: BusinessObjective` en input
  - Le transmet à `runAccountDirector`
- **`strategy-director.ts`** :
  - Charge le playbook via `getPlaybook(vertical)` pour les `contentPillars` et `bestTimes`
  - Fallback sur les defaults HORECA si aucun playbook trouvé

### Studio UX ✅
- **`app/api/studio/generate-post/route.ts`** : accepte et valide `businessObjective` depuis le body
- **`components/studio/StudioForm.tsx`** :
  - State `businessObjective` (nullable)
  - 12 chips visuels avec emoji + label (toggle, effacer)
  - Tooltip avec description au survol
  - Confirmation textuelle sous les chips quand objectif sélectionné
  - Transmis dans l'appel API `generate-post`
  - Accepte `initialObjective` prop depuis la page
- **`app/studio/page.tsx`** : lit `?objective=` depuis les searchParams, passe en `initialObjective`

---

## Ce qui reste à faire (Phase 2)

### 1. Onboarding BusinessProfile côté client

**Fichiers à créer/modifier :**

#### `app/clients/[id]/profile/page.tsx` ou onglet dans la page client existante
Ajouter un formulaire "Profil Business" avec les champs :
```typescript
vertical: string          // sélecteur parmi les verticals disponibles
mainOffers: string[]      // champ multi-valeur (chips)
avgBasketEur: number      // input numérique
peakDays: string[]        // checkboxes jours de la semaine
offDays: string[]         // checkboxes
conversionChannels: ConversionChannel[]  // checkboxes
priorityObjective: BusinessObjective    // sélecteur (12 options)
targetDelayDays: number   // 30 / 90 / 180 (select)
constraints: string[]     // textarea ou chips
```

**Route API à créer :** `PATCH /api/clients/[id]` — déjà gérée dans `updateClient()`
L'API reçoit `{ businessProfile: ClientBusinessProfile }` et l'enregistre.

#### `app/clients/[id]/page.tsx` (déjà existante)
Ajouter une section ou un badge "Profil Business" sous l'identité client, avec :
- Affichage du vertical actif
- Objectif prioritaire en badge
- Bouton "Configurer" si `businessProfile === null`

### 2. Vertical selector à la création client

**Fichier :** `app/clients/new/page.tsx` ou `components/clients/ClientForm.tsx`
- Remplacer le select `type` hardcodé par un sélecteur de vertical enrichi (avec l'emoji et le label du playbook)
- Nouveau verticals (coiffeur, padel, etc.) mappent vers `type: 'restaurant'` en DB + `businessProfile.vertical = 'coiffeur'`

### 3. Page "Objectifs" ou tableau de bord par objectif

**Fichier à créer :** `app/clients/[id]/objectives/page.tsx` (optionnel)
- Affiche les `campaignTemplates` du playbook du client
- Bouton "Démarrer cette campagne" → redirige vers `/studio?client=[id]&objective=[objectif]&brief=[briefTemplate]`

### 4. Passer le `businessProfile` au supervisor

**Fichier :** `lib/agents/supervisor.ts`
Ajouter dans le system prompt une section :
```
## Objectif business du post
Ce post doit servir : [objectiveLabel]
Vérifier que le CTA, le ton et le pilier choisi vont dans ce sens.
```

### 5. Performance analyst (optionnel)

**Fichier :** `lib/agents/performance-analyst.ts`
Ajouter une analyse par objectif business : est-ce que les posts publiés ont servi le `priorityObjective` du `businessProfile` ?

---

## Architecture décisions prises

### Contrainte SQL CHECK sur `type`
Le schéma SQL a un `CHECK(type IN ('restaurant', 'hotel', 'bar', 'bnb', 'restaurant_hotel'))` — **impossible de modifier sans recréer la table en SQLite**.

**Décision :** Garder `type` comme clé DB HORECA legacy. Le vrai vertical vit dans `businessProfile.vertical`. Tous les agents lisent `client.businessProfile?.vertical ?? client.type` pour choisir le bon playbook.

Les nouveaux verticals (coiffeur, padel, etc.) stockent `type: 'restaurant'` en DB (fallback valide) et `businessProfile.vertical: 'coiffeur'` pour la logique métier.

### Types sans duplication
`lib/playbooks/types.ts` re-exporte `BusinessObjective`, `ConversionChannel`, `BUSINESS_OBJECTIVE_LABELS` depuis `@/types/client` au lieu de les redéclarer. Source unique de vérité.

### Injection playbook
Les `promptContext` sont de longues strings (500-800 tokens) injectées dynamiquement. L'overhead est justifié : c'est l'expertise senior qui différencie les sorties.

---

## Commandes de validation

```bash
# TypeScript (zéro erreur attendue hors .next/types/validator.ts)
npx tsc --noEmit 2>&1 | grep -v ".next/types"

# Lint
npm run lint

# Dev server
npm run dev   # port 3010
```

---

## Structure playbook — Interface de référence

```typescript
interface VerticalPlaybook {
  vertical: string           // identifiant unique ('restaurant', 'coiffeur', ...)
  label: string              // label UI français
  emoji: string
  dbType: ClientType         // mapping vers la contrainte SQL
  color: string              // classe Tailwind gradient
  businessObjectives: BusinessObjective[]
  contentPillars: string[]
  peakDays: string[]
  offDays: string[]
  bestPostingTimes: string[]
  conversionChannels: ConversionChannel[]
  campaignTemplates: CampaignTemplate[]
  primaryKpis: string[]
  promptContext: string      // bloc injecté dans les system prompts agents
  commonMistakes: string[]
  peakSeasons: string[]
  offSeasons: string[]
}
```

---

## Fichiers clés à lire pour continuer

| Fichier | Pourquoi |
|---|---|
| `lib/playbooks/index.ts` | Point d'entrée, `getPlaybook()` |
| `lib/playbooks/restaurant.ts` | Référence pour le pattern playbook |
| `lib/agents/account-director.ts` | Agent principal avec injection playbook |
| `types/client.ts` | Tous les types business (BusinessObjective, etc.) |
| `components/studio/StudioForm.tsx` | UI avec chips d'objectifs |
| `lib/db/migrations/009-add-business-profile.ts` | Migration additive |
