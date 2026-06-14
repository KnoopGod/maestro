import { nanoid } from 'nanoid'
import { query, queryOne } from '../index'

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
    role: row.role as UserRole,
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
  await queryOne(
    `INSERT INTO users (id, email, name, role, password_hash, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [id, input.email, input.name, input.role, input.passwordHash, now]
  )
  const user = await getUserById(id)
  if (!user) throw new Error('Failed to create user')
  return user
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [id])
  return row ? mapRow(row) : null
}

export async function getUserByEmail(
  email: string
): Promise<(User & { passwordHash: string }) | null> {
  const row = await queryOne<UserRow>(`SELECT * FROM users WHERE email = ?`, [email])
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
  const fields: string[] = []
  const args: unknown[] = []

  if (input.name !== undefined) { fields.push('name = ?'); args.push(input.name) }
  if (input.role !== undefined) { fields.push('role = ?'); args.push(input.role) }
  if (input.active !== undefined) { fields.push('active = ?'); args.push(input.active ? 1 : 0) }

  if (fields.length === 0) throw new Error('No fields to update')

  args.push(id)
  await queryOne(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, args)

  const user = await getUserById(id)
  if (!user) throw new Error('User not found')
  return user
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await queryOne(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id])
}

export async function setLastLogin(id: string): Promise<void> {
  await queryOne(`UPDATE users SET last_login_at = ? WHERE id = ?`, [Date.now(), id])
}
