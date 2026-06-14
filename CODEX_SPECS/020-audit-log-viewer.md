# Spec 020 — Viewer Audit Log Admin

**Date** : 2026-06-14
**Priorité** : Normale (conformité, sécurité)
**Dépend de** : Spec 011 (audit_log table), Spec 014 (auth events)

---

## Contexte

La table `audit_log` enregistre les connexions, déconnexions, changements de mot de passe,
et toute action critique. Il n'y a pas encore d'UI pour consulter ces logs.

## Périmètre

### Fichiers à créer
- `app/api/admin/audit-log/route.ts` — GET : liste les entrées (paginées, 50 par page)
- `app/settings/audit/page.tsx` — page admin avec tableau des dernières 200 entrées

## API

### `GET /api/admin/audit-log?limit=50&offset=0`

Retourne :
```json
{ "entries": [{ "id", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt", "ip" }], "total": N }
```

## Validation

Accessible depuis `/settings` → section Sécurité (actuellement WIP).
