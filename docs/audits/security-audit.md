# Audit sécurité — MAESTRO

Date : 2026-06-13  
Contexte : V1 mono-utilisateur interne. Non ouvert au public.

---

## Score global (V1 interne)

| Domaine | État | Priorité |
|---|---|---|
| Authentification | ⚠️ Suffisant V1, insuffisant V2 | Phase 7 |
| Tokens sociaux | 🔴 En clair — critique avant prod partagée | Phase 3 |
| CSRF | 🔴 Absent | Phase 3 |
| Isolation données | ✅ Mono-tenant — OK en V1 | Phase 7 |
| Validation entrées | ⚠️ Partielle | En continu |
| Secrets | ✅ Jamais dans le code | Maintenir |
| Headers HTTP | 🔴 Absents | Phase 6 |
| Uploads | ⚠️ À vérifier | Phase 3 |
| Routes protégées | ✅ Middleware sur toutes les routes | Maintenir |

---

## Détail par domaine

### Authentification

**Ce qui fonctionne** :
- Cookie httpOnly (non accessible en JS)
- Cookie secure en production
- Validation par HMAC (timing-safe compare)
- Middleware sur toutes les routes sauf les publiques

**Ce qui manque** :
- Pas de CSRF token
- Pas d'expiration de session dynamique
- Pas de rotation de session après login
- Session liée au mot de passe, pas à une session DB

### Tokens Meta

Stockés en clair dans `client_social_accounts.access_token`.  
Un dump de `maestro.db` expose tous les tokens.

**Plan de chiffrement (Phase 3)** :
```
clé = PBKDF2(MAESTRO_ENCRYPTION_KEY, client_id, iterations=100000)
stockage = { iv: hex, ciphertext: hex, tag: hex }
```

### Validation des entrées

**Bien validé** :
- `clientId`, `platforms`, `contentType` dans generate-post
- `postId` dans publish-post
- Type MIME dans les uploads (à vérifier exhaustivement)

**À renforcer** :
- Longueur maximale des briefs et captions (prévenir les abus coût IA)
- Validation des URLs dans `ctaUrl` (prévenir SSRF)
- Rate limiting sur les routes IA (actuellement absent)

### Routes sensibles

| Route | Protection |
|---|---|
| `POST /api/studio/generate-post` | Middleware ✅ |
| `POST /api/studio/publish-post` | Middleware ✅ |
| `POST /api/cron/publish-due` | CRON_SECRET ou session ✅ |
| `GET /api/cron/publish-due` | CRON_SECRET ou session ✅ |
| `POST /api/meta/connect` | Middleware ✅ |
| `DELETE /api/clients/[id]/assets/[assetId]` | Middleware ✅ |

### Logs et traces

**Risques** :
- `console.error()` dans les agents — ne pas logger les tokens ou données sensibles
- Les `outputData` des `agent_events` peuvent contenir des briefs clients — ne pas exposer via API non authentifiée

---

## Avant de passer en production partagée (V2)

Obligatoire avant d'inviter des utilisateurs externes :
1. Chiffrement des tokens Meta (Phase 3)
2. Protection CSRF (Phase 3)
3. Headers de sécurité HTTP (Phase 6)
4. Rate limiting sur les routes IA
5. Audit complet des logs (pas de données sensibles)
6. Validation des URLs (SSRF sur ctaUrl)
