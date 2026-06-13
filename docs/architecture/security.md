# Architecture — Sécurité

## État actuel (V1)

MAESTRO V1 est un outil interne mono-utilisateur. Le niveau de sécurité actuel est suffisant pour ce contexte mais **doit être renforcé avant toute ouverture d'accès externe**.

## Authentification

**Mécanisme** : Cookie de session HMAC-SHA256.

```
CODEXRS_PASSWORD → HMAC-SHA256("codexrs-session") → cookie codexrs_session
```

- Cookie httpOnly, secure (prod), sameSite: strict
- Durée : 30 jours
- Pas d'expiration dynamique
- Pas de révocation individuelle

**Fichiers** : `lib/auth/session.ts`, `proxy.ts`

### Risques identifiés

| Risque | Gravité | Phase de correction |
|---|---|---|
| CSRF résiduel sur mutations | Réduit par SameSite strict + validation Origin | À renforcer si multi-utilisateur |
| Session permanente (pas de rotation) | Important | Phase 7 (SaaS) |
| Un seul mot de passe pour tous | Important (V2) | Phase 7 (SaaS) |

## Tokens Meta

Les tokens `access_token` et `refresh_token` des comptes Meta sont chiffrés avant stockage si `MAESTRO_ENCRYPTION_KEY` est configuré.

**Risque résiduel** : les anciens tokens restent en clair jusqu'à reconnexion/migration, et l'absence de `MAESTRO_ENCRYPTION_KEY` force le mode compatibilité en clair.

**Implémentation Phase 3** : AES-256-GCM avec clé dérivée de `MAESTRO_ENCRYPTION_KEY` + `client_id`.

```typescript
// encrypt(token, clientId) → { v, iv, tag, ct }
// decrypt(envelope, clientId) → token
// Clé = PBKDF2(MAESTRO_ENCRYPTION_KEY, client_id, iterations=100000)
```

## Routes publiques

Routes accessibles sans authentification :
```
/login
/api/auth/login
/api/auth/logout
/api/cron/publish-due    ← protégé par CRON_SECRET séparément
/privacy
/data-deletion
```

**Toutes les autres routes** sont protégées par `proxy.ts`.

## Cron

`POST /api/cron/publish-due` accepte :
1. `Authorization: Bearer CRON_SECRET` (Vercel Cron)
2. Cookie de session valide (test manuel)

Si `CRON_SECRET` n'est pas configuré et que l'utilisateur n'est pas connecté → 500.

## Uploads

Les uploads de fichiers dans `app/api/clients/[id]/assets/route.ts` :
- Acceptent : images, vidéos, PDF, Word
- Valident le type MIME côté serveur
- Stockent dans `public/uploads/` (local) ou Vercel Blob (prod)

⚠️ **Vérifier** : la validation MIME est-elle complète ? Les fichiers exécutables sont-ils filtrés ?

## Headers de sécurité

Actuellement : **aucun header de sécurité configuré** dans `next.config.ts`.

**Plan Phase 6** : Ajouter dans `next.config.ts` :
```typescript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
  // CSP à définir après audit des sources
]
```

## Secrets — règles absolues

1. Ne jamais logger un token, une clé API ou un mot de passe.
2. Ne jamais committer `.env.local`.
3. Ne jamais exposer un secret dans une réponse API.
4. Ne jamais afficher un token dans l'interface utilisateur.
5. Vercel Env Vars pour la production — jamais dans le code.
