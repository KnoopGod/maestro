import { db } from '../index'

export async function migrateMultiUsersFoundation() {
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

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)`)
}
