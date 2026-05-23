/**
 * Migration 002 — add scheduling support to posts.
 *
 * - Adds `scheduled_at INTEGER` (nullable)
 * - Adds `supervisor_review TEXT` (JSON, last cached review)
 * - Drops the old CHECK constraint on status so we can store
 *   `scheduled` and `ready` in addition to `draft | published | failed`.
 *
 * SQLite does not support ALTER TABLE DROP CONSTRAINT, so we recreate
 * the table when the old constraint is detected. Idempotent.
 */
import { db, query, queryOne } from '../index'

interface SqliteMaster { sql: string | null }

export async function migratePostsScheduling() {
  const tableInfo = await queryOne<SqliteMaster>(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'`
  )
  if (!tableInfo?.sql) {
    // Fresh DB — schema.ts will create the new shape.
    return { added: 0, recreated: false }
  }

  const hasCheck = /CHECK\(status IN/.test(tableInfo.sql)
  const hasScheduledAt = /\bscheduled_at\b/.test(tableInfo.sql)
  const hasReview = /\bsupervisor_review\b/.test(tableInfo.sql)

  if (!hasCheck && hasScheduledAt && hasReview) {
    return { added: 0, recreated: false }
  }

  // Recreate the table so we can drop CHECK and add the new columns.
  await db.execute(`ALTER TABLE posts RENAME TO posts_old`)

  await db.execute(`
    CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'draft',
      platforms TEXT NOT NULL,
      content_type TEXT NOT NULL,
      brief TEXT NOT NULL,
      reasoning TEXT,
      caption TEXT NOT NULL,
      hashtags TEXT,
      hook TEXT,
      cta TEXT,
      image_asset_id TEXT REFERENCES client_assets(id) ON DELETE SET NULL,
      image_url TEXT,
      image_prompt TEXT,
      impact_score INTEGER DEFAULT 0,
      impact_analysis TEXT,
      supervisor_review TEXT,
      meta_post_ids TEXT,
      scheduled_at INTEGER,
      published_at INTEGER,
      error TEXT,
      cost REAL DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  await db.execute(`
    INSERT INTO posts (
      id, client_id, status, platforms, content_type, brief, reasoning,
      caption, hashtags, hook, cta, image_asset_id, image_url, image_prompt,
      impact_score, impact_analysis, meta_post_ids, published_at, error,
      cost, tokens_used, created_at, updated_at
    )
    SELECT
      id, client_id, status, platforms, content_type, brief, reasoning,
      caption, hashtags, hook, cta, image_asset_id, image_url, image_prompt,
      impact_score, impact_analysis, meta_post_ids, published_at, error,
      cost, tokens_used, created_at, updated_at
    FROM posts_old
  `)

  const moved = await query<{ count: number }>(`SELECT COUNT(*) AS count FROM posts`)
  await db.execute(`DROP TABLE posts_old`)

  // Re-create the indexes (lost with the old table).
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_client ON posts(client_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at)`)

  return { added: moved[0]?.count ?? 0, recreated: true }
}

if (require.main === module) {
  migratePostsScheduling()
    .then(result => {
      console.log(`[migration:002-add-scheduling]`, result)
      process.exit(0)
    })
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}
