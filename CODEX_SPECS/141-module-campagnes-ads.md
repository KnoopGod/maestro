# Spec 141 — Module Campagnes (Meta Ads + Google Ads)

## Context

**Pourquoi.** L'offre MAESTRO passe de « gestion des réseaux sociaux » à « croissance
complète : organique + publicité + reporting ». C'est ce qui justifie un abonnement
premium et la promesse « augmenter le CA ».

**Décision d'architecture — 3 phases, on ne code QUE la Phase 1 :**

| Phase | Contenu | API externe | Risque |
|---|---|---|---|
| **1 (cette spec)** | Campagnes **assistées** : MAESTRO génère la stratégie, les créas et suit le ROI. L'achat se fait dans Meta Ads Manager / Google Ads (opéré par l'agence). | Aucune | Nul |
| 2 (plus tard) | Meta Marketing API : boost de posts, puis création de campagnes | `ads_management` + App Review + ad account | Dépense réelle par API |
| 3 (plus tard) | Google Ads API | Developer token (validation Google, semaines) + OAuth | Idem |

La Phase 1 est vendable telle quelle : le client paie la stratégie, les créas et le
reporting — pas le clic dans Ads Manager. Et elle ne peut PAS dépenser l'argent d'un
client par bug, contrairement aux phases API.

**Fichiers à lire avant d'implémenter :**
- `lib/playbooks/index.ts` + `lib/playbooks/types.ts` — verticales, objectifs, promptContext
- `types/finance.ts` + `lib/db/queries/finance.ts` — `monthlyMetaAdsBudget` / `monthlyGoogleAdsBudget` existent déjà par client
- `lib/agents/social-expert.ts` — modèle de structure d'agent (input/output typés, withTracking, parsing JSON avec fallback regex)
- `lib/agents/prompts.ts` — `createAgentQualityEnvelope`
- `lib/db/migrations/017-add-business-profile.ts` — modèle de migration additive idempotente
- `types/client.ts` — `BusinessObjective`, `ClientBusinessProfile`

## Goal

Un module Campagnes où l'agence : crée une campagne (client, canal, objectif, budget,
dates) → l'IA génère un **plan média complet + les créas prêtes à copier** dans
Ads Manager / Google Ads → l'agence saisit les résultats → MAESTRO calcule le ROAS
et alimente le rapport mensuel.

## Files to modify

### 1. `types/campaign.ts` (NOUVEAU)

```ts
export type CampaignChannel = 'meta_ads' | 'google_ads'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface MetaAdCreative {
  angle: string            // l'angle marketing de cette variante
  primaryText: string      // max ~300 car., accroche incluse
  headline: string         // max 40 car.
  description: string      // max 30 car.
  cta: string              // ex: 'Demander un devis', 'Réserver'
  visualBrief: string      // brief du visuel (réutilisable dans le Studio)
}

export interface GoogleAdCreative {
  headlines: string[]      // 10-15 titres, max 30 car. CHACUN (RSA)
  descriptions: string[]   // 4 descriptions, max 90 car. CHACUNE
  keywords: string[]       // 15-25 mots-clés, intentions commerciales
  negativeKeywords: string[]
}

export interface MediaPlan {
  audience: string             // ciblage recommandé, en clair
  budgetSplit: string          // répartition recommandée (ex: 70% prospection / 30% retargeting)
  duration: string
  landingAdvice: string        // où envoyer le clic + quoi vérifier sur la page
  metaCreatives?: MetaAdCreative[]     // 3 variantes si channel = meta_ads
  googleCreative?: GoogleAdCreative    // si channel = google_ads
  kpisToWatch: string[]
}

export interface CampaignResults {
  spendEur: number | null
  impressions: number | null
  clicks: number | null
  leads: number | null          // conversions déclarées (devis, résas, appels)
  revenueEur: number | null     // CA attribué, déclaré par le client
  notes: string | null
  updatedAt: number
}

export interface Campaign {
  id: string
  clientId: string
  name: string
  channel: CampaignChannel
  objective: BusinessObjective
  budgetEur: number
  startAt: number | null
  endAt: number | null
  status: CampaignStatus
  brief: string                 // le brief saisi par l'agence
  mediaPlan: MediaPlan | null   // généré par l'agent
  results: CampaignResults | null
  cost: number                  // coût IA de génération (interne)
  createdAt: number
  updatedAt: number
}
```

Labels UI : `CAMPAIGN_CHANNELS`, `CAMPAIGN_STATUS` (même pattern que `CLIENT_TYPES`).

### 2. `lib/db/migrations/018-add-campaigns.ts` (NOUVEAU — additive, idempotente)

Table `campaigns` : colonnes scalaires + `media_plan TEXT` / `results TEXT` (JSON),
`channel TEXT CHECK(channel IN ('meta_ads','google_ads'))`,
`status TEXT CHECK(status IN ('draft','active','paused','completed'))`,
FK logique `client_id` (pas de contrainte FK réelle — cohérent avec le reste du schéma).
Brancher dans `lib/db/schema.ts` comme les migrations existantes.

### 3. `lib/db/queries/campaigns.ts` (NOUVEAU)

`createCampaign`, `getCampaign`, `listCampaigns({ clientId?, status? })`,
`updateCampaign` (patch partiel), `saveCampaignResults`. Pattern `mapRow` camelCase,
parsing JSON avec try/catch comme `clients.ts`.

### 4. `lib/agents/media-planner.ts` (NOUVEAU — agent, règles MAESTRO complètes)

- **Responsabilité unique** : produire un `MediaPlan` à partir du contexte client + campagne.
- Input typé : `{ client: Client, channel, objective, budgetEur, brief, durationDays }`
- Output typé : `{ plan: MediaPlan, tokensUsed, cost, model }`
- Modèle : Opus via la config centrale des modèles (même source que les autres agents).
- Injecter : `getPlaybook(client.businessProfile?.vertical ?? client.type).promptContext`,
  le profil business (offres, panier moyen, canaux), la ville.
- Prompt v1 (commenter la version) :
  - Meta : 3 variantes d'angle DIFFÉRENTES (preuve sociale / offre / problème-solution),
    respecter les limites de caractères, CTA cohérent avec l'objectif.
  - Google : headlines ≤ 30 car. STRICT, descriptions ≤ 90 car. STRICT, mots-clés en
    intention commerciale (pas de génériques), negative keywords.
  - Toujours en français. Ton adapté à la verticale (B2B ≠ restaurant).
- Parsing JSON avec fallback regex (pattern existant). **Valider les limites de
  caractères côté code** après parsing : tronquer proprement ou re-demander, ne jamais
  stocker une headline > 30 car. pour Google.
- `withTracking` + coût enregistré sur la campagne (`cost`).

### 5. Routes API (NOUVELLES)

- `POST /api/campaigns` — crée la campagne puis lance la génération du plan
  (synchrone acceptable : 1 seul appel IA ~10-20 s, pas de génération d'image).
  Valider : clientId existe, channel/objective dans les enums, budget > 0.
- `GET /api/campaigns?clientId=` — liste.
- `PATCH /api/campaigns/[id]` — statut, résultats (`results`), régénération du plan
  (action `regenerate` — écrase `mediaPlan`, additionne `cost`).
- Toutes protégées par le middleware (vérifier qu'elles ne sont PAS dans PUBLIC_PATHS).

### 6. UI

- **`app/campaigns/page.tsx`** — vue agence : toutes les campagnes, filtres statut/client,
  carte par campagne (canal, budget, ROAS si résultats). Lien création.
- **`app/campaigns/new/page.tsx`** — formulaire : client, canal (Meta/Google), objectif
  (chips, mêmes labels que le Studio), budget €, dates, brief. Submit → génération → redirect détail.
- **`app/campaigns/[id]/page.tsx`** — LE cœur :
  - Plan média affiché par sections (audience, répartition budget, landing).
  - Créas avec **bouton « Copier » par champ** (headline, texte, description) —
    c'est ce qui rend le copier-coller vers Ads Manager rapide.
  - Compteurs de caractères visibles (ex: `28/30`) — vert si OK, rouge si dépassé.
  - Section « Résultats » : formulaire de saisie (dépense, impressions, clics, leads, CA)
    + calculs affichés : CPC, CPL, **ROAS = CA / dépense** (afficher « — » si CA absent,
    ne jamais inventer).
  - Bouton « Régénérer le plan » avec confirmation.
- Ajouter « Campagnes » dans la navigation (sidebar + BottomNav « Plus » si pertinent)
  et un raccourci sur la fiche client.

### 7. Intégration rapport mensuel (spec 140)

Ajouter dans `MonthlyReportData` (si la 140 est déjà implémentée, sinon noter dans la spec 140) :
`campaigns: Array<{ name, channel, spendEur, leads, revenueEur, roas }>` — section
« Vos campagnes publicitaires » dans le rapport. Le coût IA reste interne.

## Don't touch

- `lib/agents/meta-publisher.ts` — la publication organique ne change pas.
- Aucune API Meta Marketing / Google Ads en Phase 1 — pas de dépendance npm nouvelle.
- Le tunnel organique (Studio → Validation → Publication) — zéro régression tolérée.
- `.env.local` / variables d'environnement — rien de nouveau requis en Phase 1.

## Validation

```bash
npx tsc --noEmit && npm run lint
npx tsx -e "import('./lib/db/schema').then(...)"  # migration passe sur DB existante
```

Manuel :
- Créer une campagne Meta pour un client B2B → 3 variantes avec angles réellement différents,
  limites de caractères respectées, boutons copier OK.
- Créer une campagne Google → toutes les headlines ≤ 30 car., descriptions ≤ 90 car.
- Saisir des résultats partiels (dépense sans CA) → ROAS affiche « — », pas NaN.
- Client sans businessProfile → l'agent utilise le playbook par défaut sans crash.

## Output expected

- 1 migration, 1 fichier types, 1 fichier queries, 1 agent, 3 routes, 3 pages, navigation
- ~900 lignes au total
- 0 erreur tsc/lint, tunnel organique intact

## V2/V3 (ne PAS coder — pré-requis externes à lancer en parallèle)

- **Meta Marketing API** : demander `ads_management` dans l'App Review (voir
  `docs/operations/meta-app-review.md`), connecter l'ad account par client, commencer
  par le boost de posts existants (le plus simple et le plus demandé).
- **Google Ads API** : demander le developer token (Basic Access — dossier à monter),
  OAuth par client ou MCC agence. Prévoir des semaines de délai.
