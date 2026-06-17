# Spec 028 — Webhook Notifications

## Contexte

MAESTRO publie des posts sur Facebook/Instagram automatiquement. Aujourd'hui, l'utilisateur
doit rafraîchir l'interface pour savoir si la publication a réussi. Les intégrations externes
(Slack, email, Zapier) ne sont pas possibles sans webhook.

## User Story

> En tant qu'agent HORECA, je veux recevoir une notification (Slack, email) quand
> un post est publié ou échoue, sans avoir à surveiller l'interface.

## Comportement

Quand un post est publié (succès ou erreur), MAESTRO envoie un `POST` HTTP vers `MAESTRO_WEBHOOK_URL`.

### Payload publié avec succès

```json
{
  "event": "post.published",
  "timestamp": 1718000000000,
  "post": {
    "id": "abc123",
    "clientName": "Restaurant Le Jardin",
    "platforms": ["instagram", "facebook"],
    "imageUrl": "https://...",
    "caption": "...",
    "hashtags": ["#restaurant", "#horeca"],
    "publishedAt": 1718000000000,
    "cost": 0.042
  }
}
```

### Payload échec

```json
{
  "event": "post.failed",
  "timestamp": 1718000000000,
  "post": {
    "id": "abc123",
    "clientName": "Restaurant Le Jardin",
    "error": "Instagram token expired"
  }
}
```

## Architecture

- `lib/webhook/notify.ts` — utilitaire `notifyWebhook(event, payload)`
- Appelé depuis `publish-pipeline.ts` après chaque publication
- Non bloquant : si le webhook échoue, la publication n'est pas affectée
- Timeout : 5s max
- Variable d'env : `MAESTRO_WEBHOOK_URL` (optionnel — si absent, aucun appel)

## Fichiers

- `CODEX_SPECS/028-webhook-notifications.md`
- `lib/webhook/notify.ts` (nouveau)
- `lib/agents/publish-pipeline.ts` (modifié — appel notify)
