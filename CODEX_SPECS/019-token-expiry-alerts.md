# Spec 019 — Alertes Expiration Tokens Sociaux

**Date** : 2026-06-14
**Priorité** : Haute (évite les interruptions de publication)
**Dépend de** : social-accounts table (expires_at column)

---

## Contexte

Les tokens Meta (Facebook/Instagram) expirent après 60 jours.
Sans alerte proactive, les publications échouent silencieusement après expiration.

## Implémentation

- `listExpiringTokens(withinDays = 14)` dans `social-accounts.ts`
- `TokenExpiryBanner` component sur la home page
- Rouge si ≤3 jours, ambre si ≤14 jours
- Lien direct vers `/clients/[id]/connections` pour renouveler

## Déjà implémenté dans ce commit.
