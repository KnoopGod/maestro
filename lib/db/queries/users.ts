import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'

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

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'owner' ? 'owner' : 'editor',
    active: row.active === 1,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

export async function createUser(input: {
  email: string
  name: string
  role: UserRole
  passwordHash: string
}): Promise<User> {
  const id = nanoid()
  const now = Date.now()
  await db.execute({
    sql: `INSERT INTO users (id, email, name, role, password_hash, active, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, NULL)`,
    args: [id, input.email.trim().toLowerCase(), input.name.trim(), input.role, input.passwordHash, now],
  })
  const user = await getUserById(id)
  if (!user) throw new Error('Failed to create user')
  return user
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [id])
  return row ? mapRow(row) : null
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const row = await queryOne<UserRow>(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()])
  if (!row) return null
  return { ...mapRow(row), passwordHash: row.password_hash }
}

export async function listUsers(): Promise<User[]> {
  const rows = await query<UserRow>(`SELECT * FROM users ORDER BY created_at ASC`)
  return rows.map(mapRow)
}

export async function updateUser(
  id: string,
  input: Partial<{ name: string; role: UserRole; active: boolean }>
): Promise<User> {
  const sets: string[] = []
  const args: unknown[] = []

  if (input.name !== undefined) {
    sets.push('name = ?')
    args.push(input.name.trim())
  }
  if (input.role !== undefined) {
    sets.push('role = ?')
    args.push(input.role)
  }
  if (input.active !== undefined) {
    sets.push('active = ?')
    args.push(input.active ? 1 : 0)
  }
  if (sets.length === 0) throw new Error('Aucun champ à mettre à jour')

  args.push(id)
  const row = await queryOne<UserRow>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = ? RETURNING *`,
    args
  )
  if (!row) throw new Error('Utilisateur introuvable')
  return mapRow(row)
}

export async function setLastLogin(id: string): Promise<void> {
  await db.execute({
    sql: `UPDATE users SET last_login_at = ? WHERE id = ?`,
    args: [Date.now(), id],
  })
}
