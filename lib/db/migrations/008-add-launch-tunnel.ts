import { db } from '../index'

export async function migrateLaunchTunnel() {
  // Tunnel de lancement : progression des 5 étapes + conseils IA cachés par client
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_launch_tunnel (
      client_id TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
      tasks_done TEXT DEFAULT '[]',
      advice TEXT,
      advice_cost REAL DEFAULT 0,
      advice_generated_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
}
