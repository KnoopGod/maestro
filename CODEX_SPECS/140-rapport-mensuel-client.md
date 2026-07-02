# Spec 140 — Rapport mensuel client (preuve de valeur)

## Context

**Pourquoi.** MAESTRO vend un abonnement de gestion des réseaux sociaux dont la promesse est
« augmenter le CA ». Un abonnement se renouvelle quand le client VOIT la valeur. Ce rapport
est le document mensuel qui matérialise cette valeur — c'est l'artefact de rétention n°1.

**Fichiers à lire avant d'implémenter :**
- `types/post.ts` — `PostInsights` (likes, comments, shares, reach, impressions, saves — données Meta réelles)
- `app/api/cron/sync-insights/route.ts` — les insights sont déjà synchronisés toutes les 12h (30 derniers jours)
- `app/analytics/growth/page.tsx` — agrégations par client déjà écrites (à réutiliser comme modèle)
- `lib/db/queries/posts.ts` — `listPosts({ includeInsights: true })`, `getPillarDistribution`
- `types/client.ts` — `BUSINESS_OBJECTIVES` (l'objectif prioritaire du client structure le rapport)
- `lib/playbooks/index.ts` — `getPlaybook(vertical).kpis` (les KPIs à mettre en avant par verticale)
- `app/clients/[id]/page.tsx` — pour le bouton d'accès au rapport

## Goal

Une page rapport mensuel par client, imprimable en PDF (Cmd+P), rédigée dans la langue du
client (pas de jargon agence), qui relie les publications du mois à son objectif business.

## Files to modify

### 1. `lib/reports/monthly.ts` (NOUVEAU)

Module de calcul pur (pas de JSX). Exporte :

```ts
export interface MonthlyReportData {
  client: Client
  monthLabel: string            // "Juillet 2026"
  periodStart: number
  periodEnd: number
  published: Post[]             // posts publiés dans le mois, insights inclus
  totals: {
    postsPublished: number
    reach: number               // somme insights reach (toutes plateformes)
    impressions: number
    interactions: number        // likes + comments + shares + saves
    engagementRate: number | null  // interactions / reach, null si reach = 0
  }
  byPlatform: Array<{ platform: string; posts: number; reach: number; interactions: number }>
  topPosts: Post[]              // top 3 par interactions
  pillarCoverage: Array<{ pillar: string; count: number }>
  objective: { key: BusinessObjective; label: string } | null
  playbookKpis: string[]        // KPIs de la verticale — affichés comme "indicateurs à suivre chez vous"
  scheduledNextMonth: number    // posts déjà planifiés le mois suivant
  prevMonthTotals: { postsPublished: number; reach: number; interactions: number } | null
                                // pour les deltas mois vs mois-1 (null si aucun post avant)
}

export async function buildMonthlyReport(clientId: string, month: string /* "2026-07" */): Promise<MonthlyReportData | null>
```

Règles de calcul :
- Période = [1er du mois 00:00, 1er du mois suivant 00:00) en heure locale serveur.
- Un post compte dans le mois de son `publishedAt` (pas `createdAt`).
- Insights multi-plateformes : sommer les `metaInsights[]` du post.
- `engagementRate` arrondi à 1 décimale (en %). Ne JAMAIS inventer de valeur si reach = 0 → null.
- **Ne pas exposer `cost` ni `tokensUsed` dans ce module** : le coût IA est une donnée interne
  agence, elle ne doit pas fuiter dans un document client.

### 2. `app/clients/[id]/report/page.tsx` (NOUVEAU — Server Component)

- `searchParams: { month?: string }` — défaut : mois précédent (le rapport se produit en début de mois).
- Appelle `buildMonthlyReport`. Si null (client introuvable) → `notFound()`.
- Sections dans cet ordre :
  1. **En-tête** : logo/emoji client, nom, mois, « Rapport d'activité — réseaux sociaux ».
  2. **L'essentiel** : 4 grandes cartes — posts publiés, personnes atteintes (reach),
     interactions, taux d'engagement. Deltas vs mois précédent si dispo (`↑ +32 %`).
  3. **Votre objectif** : label de l'objectif prioritaire + phrase sur la stratégie du mois
     (piliers couverts). Utiliser `BUSINESS_OBJECTIVES[key].label` + `pillarCoverage`.
  4. **Vos 3 meilleures publications** : visuel (miniature), caption tronquée, chiffres.
  5. **Indicateurs à suivre chez vous** : `playbookKpis` en liste — « appels, devis, RDV… »
     avec une phrase invitant le client à les partager (boucle CA — mesure manuelle V1).
  6. **Le mois prochain** : nombre de posts déjà planifiés.
  7. Pied de page : « Généré par MAESTRO le {date} ».
- Navigation mois précédent / suivant (liens `?month=`).
- **Print-friendly obligatoire** : classes `print:` Tailwind — fond blanc, texte noir,
  masquer la navigation et la sidebar (`print:hidden` sur les éléments d'UI).
  Le PDF s'obtient par impression navigateur, pas de lib PDF en V1.
- Langue : français simple. INTERDIT dans le texte : « DA », « pipeline », « agent »,
  « tokens », « playbook ». Dire « identité visuelle », « publications », « stratégie ».

### 3. `app/clients/[id]/page.tsx` (MODIFICATION LÉGÈRE)

Ajouter un bouton « 📊 Rapport mensuel » dans la rangée d'actions existante de la fiche
client, lien vers `/clients/[id]/report`. Ne rien réorganiser d'autre.

## Don't touch

- `lib/db/schema.ts` — aucune migration nécessaire, toutes les données existent.
- Le flux de publication (`publish-post`, cron) et `sync-insights`.
- Le portail `/portal/*`.
- La page `/analytics/growth` (usage interne agence, autre audience).

## Validation

```bash
npx tsc --noEmit
npm run lint
npm run dev  # → /clients/<id>/report : vérifier rendu avec 0 post, avec posts sans insights, avec insights
```

Cas limites à vérifier :
- Client sans aucun post publié dans le mois → rapport « aucune publication ce mois-ci » propre, pas de division par zéro.
- Posts publiés mais insights pas encore synchronisés → afficher les posts, chiffres reach/interactions à « en cours de collecte ».
- Impression (Cmd+P) → une à deux pages A4 lisibles fond blanc.

## Output expected

- `lib/reports/monthly.ts` (~120 lignes)
- `app/clients/[id]/report/page.tsx` (~250 lignes)
- 1 bouton ajouté sur la fiche client
- 0 erreur tsc/lint

## V2 (ne PAS coder maintenant)

- Paragraphe d'analyse rédigé par l'agent performance-analyst (avec tracking de coût).
- Saisie des résultats business réels du client (appels, devis, CA) pour boucler l'attribution.
- Envoi automatique par email en début de mois + lien portail.
