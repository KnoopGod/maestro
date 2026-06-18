import { db } from './index'

/**
 * CODEXRS database schema
 * Run `npm run db:init` to create tables (or auto-runs on first server start)
 */

export const SCHEMA_VERSION = 1

export async function initSchema() {
  // ─── Clients ──────────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('restaurant', 'hotel', 'bar', 'bnb', 'restaurant_hotel')),
      city TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'archived')),
      emoji TEXT DEFAULT '🏢',
      color TEXT DEFAULT 'from-purple-600 to-purple-900',
      description TEXT,
      brand_voice_tone TEXT,
      brand_voice_keywords TEXT,
      brand_voice_avoid TEXT,
      languages TEXT DEFAULT '["fr"]',
      strategy TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // ─── Client social accounts ───────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_social_accounts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      platform TEXT NOT NULL CHECK(platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'google_business')),
      handle TEXT,
      account_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      connected_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `)

  // ─── Client agents (assignments) ──────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_agents (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      agent_type TEXT NOT NULL,
      config TEXT,
      created_at INTEGER NOT NULL
    )
  `)

  // ─── Client assets (images, videos, documents) ────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_assets (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('image', 'video', 'logo', 'document', 'brand_guide')),
      category TEXT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      duration_seconds REAL,
      ai_description TEXT,
      ai_tags TEXT,
      dominant_colors TEXT,
      mood TEXT,
      extracted_text TEXT,
      analyzed_at INTEGER,
      starred INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)

  // ─── Client visual identity (synthèse IA) ─────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_visual_identity (
      client_id TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
      palette TEXT,
      lighting_style TEXT,
      overall_mood TEXT,
      composition_pref TEXT,
      style_keywords TEXT,
      avoid_keywords TEXT,
      style_prompt TEXT,
      visual_summary TEXT,
      analyzed_at INTEGER,
      assets_count INTEGER DEFAULT 0
    )
  `)

  // ─── Generated posts ──────────────────────────────────────────────────────
  // status values: draft | ready | scheduled | published | failed (validated in TS, not in SQL).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS posts (
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

  // ─── Indexes ──────────────────────────────────────────────────────────────
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_social_client ON client_social_accounts(client_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_agents_client ON client_agents(client_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_assets_client ON client_assets(client_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_assets_type ON client_assets(client_id, type)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_client ON posts(client_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at)`)

  // Run idempotent migrations (safe to call on every start).
  const { migratePostsScheduling } = await import('./migrations/002-add-scheduling')
  await migratePostsScheduling()
  const { migratePostInsights } = await import('./migrations/003-add-post-insights')
  await migratePostInsights()
  const { migrateAiStrategy } = await import('./migrations/004-add-ai-strategy')
  await migrateAiStrategy()
  const { migrateAgentJobs } = await import('./migrations/005-add-agent-jobs')
  await migrateAgentJobs()
  const { migrateClientFinance } = await import('./migrations/006-add-client-finance')
  await migrateClientFinance()
  const { migrateCTAFields } = await import('./migrations/007-add-cta-fields')
  await migrateCTAFields()
  const { migrateLaunchTunnel } = await import('./migrations/008-add-launch-tunnel')
  await migrateLaunchTunnel()
  const { migrateBusinessProfile } = await import('./migrations/009-add-business-profile')
  await migrateBusinessProfile()
}
