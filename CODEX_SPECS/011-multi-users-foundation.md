# CODEX_SPECS/011 — Multi-users Foundation (DB + Query Layer)

## Contexte

MAESTRO V1 utilise une auth mot de passe unique (`CODEXRS_PASSWORD`) gérée par `lib/auth/session.ts` et le middleware `proxy.ts`. Cette session est un token HMAC-SHA256 dérivé du mot de passe — il n'y a aucune notion d'utilisateur individuel en base.

Cette spec pose les **fondations schéma** pour le multi-utilisateurs V2 :
- 3 tables SQL (migration idempotente)
- 3 fichiers de queries TypeScript typées

**L'auth V1 reste intacte.** `proxy.ts`, `lib/auth/session.ts`, `app/login/page.tsx` et toutes les routes API existantes ne sont pas touchés. L'implémentation UI/UX multi-users sera faite en spec 012.

---

## Périmètre de cette spec

### Fichiers à créer
- `lib/db/migrations/011-add-users.ts`
- `lib/db/queries/users.ts`
- `lib/db/queries/user-sessions.ts`
- `lib/db/queries/audit-log.ts`

### Fichiers à modifier
- `lib/db/schema.ts` — appeler la migration 011 à la fin de `initSchema()`

### Fichiers à ne pas toucher
- `proxy.ts`
- `lib/auth/session.ts`
- `app/login/page.tsx`
- `app/api/auth/login/route.ts`
- Toutes les queries et routes API existantes

---

## Étape 1 — Migration SQL (`lib/db/migrations/011-add-users.ts`)

Créer le fichier suivant. Les trois tables sont idempotentes (`CREATE TABLE IF NOT EXISTS`).

```typescript
import { db } from '../index'

export async function migrateMultiUsersFoundation() {
  // ─── Users ────────────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER
    )
  `)

  // ─── User sessions ────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT
    )
  `)

  // ─── Audit log ────────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      ip TEXT
    )
  `)

  // ─── Indexes ──────────────────────────────────────────────────────────────
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)`)
}
```

### Contraintes SQL à respecter
- `role` : valeurs autorisées `'owner'` et `'editor'` — validées en TypeScript, pas en SQL (cohérent avec les autres tables du projet).
- `active` : `INTEGER` (0/1) car LibSQL/SQLite n'a pas de type `BOOLEAN`.
- `metadata` dans `audit_log` : colonne `TEXT` stockant du JSON sérialisé.
- `user_sessions.id` : nanoid(32) — plus long que la taille par défaut pour renforcer l'entropie des tokens de session.
- `audit_log.user_id` : nullable — permet de logger des actions système sans utilisateur associé.

---

## Étape 2 — Schéma (`lib/db/schema.ts`)

Ajouter l'appel à la migration 011 à la fin de `initSchema()`, après `migrateClientSummary()` :

```typescript
const { migrateMultiUsersFoundation } = await import('./migrations/011-add-users')
await migrateMultiUsersFoundation()
```

Le bloc doit s'insérer après la ligne :
```typescript
const { migrateClientSummary } = await import('./migrations/010-add-client-summary')
await migrateClientSummary()
```

---

## Étape 3 — Queries utilisateurs (`lib/db/queries/users.ts`)

### Types exportés

```typescript
export type UserRole = 'owner' | 'editor'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  createdAt: number
  lastLoginAt: number | null
}
```

### Interface row interne (non exportée)

```typescript
interface UserRow {
  id: string
  email: string
  name: string
  role: string
  password_hash: string
  active: number
  created_at: number
  last_login_at: number | null
}
```

### Fonction mapRow interne (non exportée)

Convertit `UserRow` en `User`. `active` est converti de `INTEGER` (0/1) en `boolean`.
Ne jamais inclure `password_hash` dans le type `User` retourné.

### Fonctions exportées

#### `createUser`
```typescript
export async function createUser(input: {
  email: string
  name: string
  role: UserRole
  passwordHash: string
}): Promise<User>
```
- Génère `id` avec `nanoid()`.
- `created_at` = `Date.now()`.
- Retourne l'utilisateur créé via `getUserById`.
- Lève une erreur si l'email existe déjà (contrainte UNIQUE SQL — laisser l'erreur se propager).

#### `getUserById`
```typescript
export async function getUserById(id: string): Promise<User | null>
```
- Retourne `null` si absent.
- N'expose pas `password_hash`.

#### `getUserByEmail`
```typescript
export async function getUserByEmail(
  email: string
): Promise<(User & { passwordHash: string }) | null>
```
- Inclut `passwordHash` — uniquement pour la vérification lors du login.
- Retourne `null` si absent.

#### `listUsers`
```typescript
export async function listUsers(): Promise<User[]>
```
- Retourne tous les utilisateurs, triés par `created_at ASC`.
- N'expose pas `password_hash`.

#### `updateUser`
```typescript
export async function updateUser(
  id: string,
  input: Partial<{ name: string; role: UserRole; active: boolean }>
): Promise<User>
```
- Met à jour uniquement les champs fournis (construction dynamique de la requête SQL).
- Lève une erreur si aucun champ n'est fourni dans `input`.
- Retourne l'utilisateur mis à jour.

#### `setLastLogin`
```typescript
export async function setLastLogin(id: string): Promise<void>
```
- Met à jour `last_login_at` à `Date.now()`.
- Silencieux si l'utilisateur n'existe pas (ne pas bloquer le flux de login).

---

## Étape 4 — Queries sessions (`lib/db/queries/user-sessions.ts`)

### Types exportés

```typescript
export interface UserSession {
  id: string
  userId: string
  expiresAt: number
  createdAt: number
  ip: string | null
  userAgent: string | null
}
```

### Interface row interne (non exportée)

```typescript
interface UserSessionRow {
  id: string
  user_id: string
  expires_at: number
  created_at: number
  ip: string | null
  user_agent: string | null
}
```

### Constante

```typescript
const DEFAULT_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 jours
```

### Fonctions exportées

#### `createUserSession`
```typescript
export async function createUserSession(
  userId: string,
  options?: { expiresInMs?: number; ip?: string; userAgent?: string }
): Promise<UserSession>
```
- Génère `id` avec `nanoid(32)` (entropie renforcée pour les tokens de session).
- `expires_at` = `Date.now() + (options?.expiresInMs ?? DEFAULT_SESSION_DURATION_MS)`.
- `created_at` = `Date.now()`.

#### `getUserSession`
```typescript
export async function getUserSession(id: string): Promise<UserSession | null>
```
- Retourne `null` si la session n'existe pas **ou si elle est expirée** (`expires_at < Date.now()`).
- Ne pas supprimer automatiquement les sessions expirées dans cette fonction (garder simple).

#### `deleteUserSession`
```typescript
export async function deleteUserSession(id: string): Promise<void>
```
- Supprime la session par `id`. Silencieux si absente.

#### `deleteUserSessionsByUserId`
```typescript
export async function deleteUserSessionsByUserId(userId: string): Promise<void>
```
- Supprime toutes les sessions d'un utilisateur (déconnexion globale).

---

## Étape 5 — Audit log (`lib/db/queries/audit-log.ts`)

### Types exportés

```typescript
export interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  metadata: Record<string, unknown> | null
  createdAt: number
  ip: string | null
}

export interface LogAuditParams {
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ip?: string
}
```

### Fonction exportée

#### `logAudit`
```typescript
export async function logAudit(params: LogAuditParams): Promise<void>
```
- Génère `id` avec `nanoid()`.
- `created_at` = `Date.now()`.
- Sérialise `metadata` en JSON (`JSON.stringify`) avant insertion.
- **Ne jamais faire échouer l'appelant** : toute la logique est dans un `try/catch` interne. En cas d'erreur, logger avec `console.error` et retourner silencieusement.

```typescript
// Pattern obligatoire
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    // ... insertion SQL
  } catch (err) {
    console.error('[audit-log] Failed to write audit entry:', err)
  }
}
```

---

## Conventions à respecter

Les conventions suivantes sont issues du projet existant et doivent être respectées dans les nouveaux fichiers :

1. **Imports** : `import { db, query, queryOne } from '../index'` — utiliser `query()` et `queryOne()` plutôt que `db.execute()` directement quand possible (les helpers attendent que le schéma soit prêt).
2. **nanoid** : `import { nanoid } from 'nanoid'` — déjà présent dans les dépendances.
3. **Pas de ORM** : requêtes SQL brutes avec template literals, cohérent avec le reste du projet.
4. **camelCase** pour les objets retournés, `snake_case` pour les colonnes SQL.
5. **mapRow interne** : chaque fichier de queries définit sa propre fonction `mapRow` non exportée.
6. **Timestamps** : `Date.now()` (millisecondes Unix), stocké en `INTEGER` — cohérent avec toutes les tables existantes.

---

## Validation

```bash
npx tsc --noEmit && npm run lint && npm run build
```

### Checklist manuelle après implémentation

- [ ] `npx tsc --noEmit` passe sans erreur.
- [ ] `npm run lint` passe sans erreur.
- [ ] `npm run build` termine sans erreur.
- [ ] `npm run dev` démarre sur `:3010` et les pages existantes fonctionnent (login, dashboard, studio).
- [ ] Les 3 nouvelles tables apparaissent dans `maestro.db` après un démarrage en dev (vérifier avec un client SQLite ou `sqlite3 maestro.db .tables`).
- [ ] L'auth V1 (mot de passe unique) fonctionne toujours normalement.

---

## Risques et points d'attention

- **Hash du mot de passe** : `passwordHash` est stocké tel quel dans la DB. L'algo de hachage (bcrypt ou argon2) sera choisi et appliqué par la couche appelante (spec 012). Les queries de cette spec ne font que stocker/retourner la valeur.
- **Sessions expirées** : `getUserSession` filtre les sessions expirées mais ne les purge pas. Un job de nettoyage périodique sera prévu en spec 012 ou 013.
- **Isolation V1/V2** : tant que `proxy.ts` utilise `isValidSessionToken()` (HMAC V1), les nouvelles tables `user_sessions` ne sont pas lues par le middleware. La coexistence est sûre.
- **LibSQL transactions** : pour `updateUser` avec construction dynamique, s'assurer que la liste des champs n'est jamais vide avant d'émettre la requête SQL (éviter `UPDATE users SET WHERE id = ?`).

---

## Dépendances

- `nanoid` — déjà dans `package.json`
- `@libsql/client` — déjà dans `package.json`
- Aucune nouvelle dépendance npm à installer
