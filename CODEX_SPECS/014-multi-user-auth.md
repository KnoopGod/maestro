# Spec 014 — Authentification Multi-Utilisateurs V2

**Date** : 2026-06-14
**Priorité** : Haute (débloque les specs 015+)
**Dépend de** : Spec 011 (tables `users`, `user_sessions`, `audit_log` déjà créées)

---

## Contexte

MAESTRO V1 utilise un mot de passe unique partagé (`CODEXRS_PASSWORD`) avec un token HMAC.
La table `users` et `user_sessions` existent en base depuis Spec 011.
Cette spec active la connexion V2 : chaque utilisateur a son propre compte avec email + mot de passe.

**L'auth V1 reste le fallback** : si `MULTI_USER_MODE=true` n'est pas dans les variables d'env,
le comportement actuel est conservé (rétrocompatibilité garantie).

---

## Variables d'environnement

```bash
MULTI_USER_MODE=true   # active la V2 — absent = V1 (CODEXRS_PASSWORD)
SESSION_SECRET=...     # 64 hex chars pour signer les sessions V2 (séparé de CODEXRS_PASSWORD)
```

---

## Périmètre

### Fichiers à créer
- `lib/auth/session-v2.ts` — gestion des cookies de session V2 (create, validate, destroy)
- `app/api/auth/login-v2/route.ts` — POST : email + password → session cookie
- `app/api/auth/logout-v2/route.ts` — POST : détruit la session
- `app/api/auth/me/route.ts` — GET : retourne l'utilisateur connecté (null si non connecté)

### Fichiers à modifier
- `proxy.ts` — brancher sur la session V2 si `MULTI_USER_MODE=true`
- `app/login/page.tsx` — afficher les champs email/password si V2 actif
- `app/api/auth/login/route.ts` — router vers V2 si `MULTI_USER_MODE=true`

### Fichiers à ne pas toucher
- `lib/auth/session.ts` — session V1 inchangée
- `lib/auth/password.ts` — déjà créé en Spec 011 (hashPassword, verifyPassword)
- `lib/db/queries/users.ts`, `user-sessions.ts` — déjà implémentés

---

## Implémentation

### 1. `lib/auth/session-v2.ts`

```typescript
import { cookies } from 'next/headers'
import { createUserSession, getUserSession, deleteUserSession } from '@/lib/db/queries/user-sessions'
import { getUserById } from '@/lib/db/queries/users'
import type { User } from '@/lib/db/queries/users'

const COOKIE_NAME = 'maestro_session_v2'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 jours
  path: '/',
}

export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<void> {
  const session = await createUserSession(userId, { ip: meta?.ip, userAgent: meta?.userAgent })
  const jar = await cookies()
  jar.set(COOKIE_NAME, session.id, COOKIE_OPTIONS)
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies()
  const sessionId = jar.get(COOKIE_NAME)?.value
  if (!sessionId) return null
  const session = await getUserSession(sessionId)
  if (!session) return null
  return getUserById(session.userId)
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const sessionId = jar.get(COOKIE_NAME)?.value
  if (sessionId) await deleteUserSession(sessionId)
  jar.delete(COOKIE_NAME)
}
```

### 2. Route `POST /api/auth/login-v2`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, setLastLogin } from '@/lib/db/queries/users'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session-v2'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const user = await getUserByEmail(email.trim().toLowerCase())
  if (!user || !user.active) {
    // Même message pour éviter la divulgation d'existence de compte
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  await createSession(user.id, {
    ip: req.headers.get('x-forwarded-for') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  })
  await setLastLogin(user.id)

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
}
```

### 3. Middleware `proxy.ts` — extension

Dans la fonction `isValidSession(req)`, ajouter une branche V2 :

```typescript
// Branche V2 — après la vérification V1 existante
if (process.env.MULTI_USER_MODE === 'true') {
  const sessionCookie = req.cookies.get('maestro_session_v2')?.value
  if (sessionCookie) {
    // Vérification DB nécessite un appel async — utiliser le pattern de cache Edge
    // Pour Next.js 16 Edge middleware, utiliser fetch interne :
    const checkRes = await fetch(new URL('/api/auth/me', req.url), {
      headers: { Cookie: `maestro_session_v2=${sessionCookie}` },
    })
    if (checkRes.ok) return true
  }
  // Si MULTI_USER_MODE actif et pas de session V2 valide → redirect login
  // NB: ne pas fallback sur V1 si MULTI_USER_MODE est actif
  return false
}
// V1 (comportement actuel)
```

### 4. Page login

Détecter `NEXT_PUBLIC_MULTI_USER_MODE` (variable publique côté client) pour afficher :
- V1 : champ mot de passe unique (actuel)
- V2 : champs email + mot de passe

---

## Règles de sécurité

- `SESSION_SECRET` doit faire au moins 32 chars — valider au démarrage.
- Cookie `httpOnly`, `secure` en prod, `sameSite: strict`.
- Message d'erreur identique pour "email inconnu" et "mauvais mot de passe" (anti-enumération).
- Limiter à 5 tentatives par IP par heure (à implémenter en V2.1 avec rate limiting).
- `user.active === false` → refus silencieux (même message que mauvais mdp).

---

## Validation

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Test manuel :
1. `MULTI_USER_MODE=false` → login V1 inchangé.
2. Créer un utilisateur via `/settings/team`.
3. `MULTI_USER_MODE=true` → login V2 avec email/password → session créée.
4. Vérifier `/api/auth/me` retourne l'utilisateur.
5. Logout → cookie supprimé, redirect login.
6. Compte désactivé → refus.
