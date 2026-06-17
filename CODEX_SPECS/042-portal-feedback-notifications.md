# Spec 042 — Portal Feedback Notifications

## Objectif
Notifier l'admin quand un client soumet un retour sur le portail
(approbation ou demande de modifications), via webhook et via le dashboard.

## Comportement

### Webhook — événements portal
Quand un client soumet un retour via `/api/portal/[token]/posts/[postId]/review` :
- Action `approved` → event `portal.approved`
- Action `changes_requested` → event `portal.changes_requested`
- Payload inclut : `postId`, `clientName`, `platforms`, `caption`, `portalComment`
- Loggé dans `webhook_deliveries` (Spec 040)

### Dashboard — `PortalFeedbackAlert`
Nouveau composant affiché sur la page d'accueil après `FailedPostsAlert`.
- Visible quand des posts ont un retour portal < 7 jours
- Affiche : emoji client, nom, extrait de caption, type de retour (✓/✎), heure relative
- Lien vers /validation pour traiter les retours
- Badges résumant le total approuvés / modifications demandées

### Query — `listPostsWithRecentPortalFeedback(withinMs)`
- Retourne les posts avec `portal_feedback IS NOT NULL` dans les X derniers ms
- JOIN sur clients pour nom + emoji
- Limite 10 résultats

## Fichiers créés / modifiés
- `lib/webhook/notify.ts` — ajout events `portal.approved` / `portal.changes_requested`, type exporté
- `app/api/portal/[token]/posts/[postId]/review/route.ts` — appel webhook post-feedback
- `lib/db/queries/posts.ts` — ajout `PortalFeedbackSummary` + `listPostsWithRecentPortalFeedback()`
- `components/dashboard/PortalFeedbackAlert.tsx` (créé)
- `app/page.tsx` — import + fetch + render `PortalFeedbackAlert`
