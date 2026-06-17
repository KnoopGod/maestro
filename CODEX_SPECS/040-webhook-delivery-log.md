# Spec 040 — Webhook Delivery Log

## Objectif
Logger chaque tentative d'envoi vers `MAESTRO_WEBHOOK_URL` pour faciliter le debugging
des notifications de publication (post.published, post.failed, post.scheduled).

## Comportement

### Table `webhook_deliveries`
Créée par la migration 016. Colonnes :
- `id` TEXT PK
- `event` TEXT (`post.published` | `post.failed` | `post.scheduled`)
- `payload` TEXT (JSON complet)
- `status` TEXT (`success` | `failed` | `timeout`)
- `http_status` INTEGER nullable
- `duration_ms` INTEGER nullable
- `error` TEXT nullable
- `created_at` INTEGER (ms epoch)

### `notifyWebhook` mise à jour
- Mesure la durée de l'appel
- Log le résultat (success/failed/timeout, HTTP status, durée) dans `webhook_deliveries`
- Le logging est fire-and-forget (`.catch(() => undefined)`) — un échec de log n'affecte pas le flux

### Page `/settings/webhooks`
Accessible depuis `/settings` via "API & Webhooks" (n'est plus WIP).
Sections :
- Statut de configuration (MAESTRO_WEBHOOK_URL défini ou non)
- Statistiques : total envois, réussis, échecs
- Tableau des 30 derniers envois : événement, client, statut, HTTP, durée, quand
- Référence des événements disponibles

## Fichiers créés / modifiés
- `lib/db/migrations/016-add-webhook-log.ts` (créé)
- `lib/db/schema.ts` (migration 016 ajoutée)
- `lib/db/queries/webhook-log.ts` (créé)
- `lib/webhook/notify.ts` (logging ajouté)
- `app/settings/webhooks/page.tsx` (créé)
- `app/settings/page.tsx` (lien déwippé)
