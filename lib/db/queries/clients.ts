import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'
import { createClientStrategy } from '@/lib/agents/strategy-director'
import type { Client, ClientStrategy, ClientType, ClientWithStats, ClientStatus } from '@/types/client'

// ─── Row mapping ──────────────────────────────────────────────────────────────

interface ClientRow {
  id: string
  name: string
  type: ClientType
  city: string | null
  status: ClientStatus
  emoji: string
  color: string
  description: string | null
  brand_voice_tone: string | null
  brand_voice_keywords: string | null
  brand_voice_avoid: string | null
  languages: string
  strategy: string | null
  created_at: number
  updated_at: number
}

function mapRow(row: ClientRow): Client {
  const strategy = JSON.parse(row.strategy ?? 'null') ?? createClientStrategy({
    type: row.type,
    name: row.name,
    city: row.city ?? '',
    positioning: row.description ?? '',
    tone: row.brand_voice_tone ?? '',
    offerFocus: '',
  })

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    city: row.city,
    status: row.status,
    emoji: row.emoji,
    color: row.color,
    description: row.description,
    brandVoiceTone: row.brand_voice_tone,
    brandVoiceKeywords: row.brand_voice_keywords,
    brandVoiceAvoid: row.brand_voice_avoid,
    languages: JSON.parse(row.languages || '["fr"]'),
    strategy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listClients(): Promise<Client[]> {
  const rows = await query<ClientRow>(
    `SELECT * FROM clients ORDER BY created_at DESC`
  )
  return rows.map(mapRow)
}

export async function listClientsWithStats(): Promise<ClientWithStats[]> {
  const clients = await listClients()
  if (clients.length === 0) return []

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthTs = startOfMonth.getTime()

  const [postStats, socialStats] = await Promise.all([
    query<{ client_id: string; posts_this_month: number; avg_impact: number | null }>(
      `SELECT
        client_id,
        COUNT(CASE WHEN created_at >= ? THEN 1 END) AS posts_this_month,
        AVG(CASE WHEN status = 'published' THEN CAST(impact_score AS REAL) ELSE NULL END) AS avg_impact
      FROM posts GROUP BY client_id`,
      [monthTs]
    ),
    query<{ client_id: string; count: number }>(
      `SELECT client_id, COUNT(*) as count FROM client_social_accounts GROUP BY client_id`
    ),
  ])

  const postMap = new Map(postStats.map(r => [r.client_id, r]))
  const socialMap = new Map(socialStats.map(r => [r.client_id, r.count]))

  return clients.map(c => {
    const ps = postMap.get(c.id)
    const avgImpact = ps?.avg_impact
    return {
      ...c,
      postsThisMonth: ps?.posts_this_month ?? 0,
      engagement: avgImpact != null ? parseFloat((avgImpact / 20).toFixed(1)) : 0,
      agentsCount: socialMap.get(c.id) ?? 0,
      connectedPlatforms: socialMap.get(c.id) ?? 0,
    }
  })
}

export async function getClient(id: string): Promise<Client | null> {
  const row = await queryOne<ClientRow>(
    `SELECT * FROM clients WHERE id = ?`,
    [id]
  )
  return row ? mapRow(row) : null
}

export async function createClient(input: {
  id?: string
  name: string
  type: ClientType
  city?: string
  emoji?: string
  color?: string
  description?: string
  brandVoiceTone?: string
  brandVoiceKeywords?: string
  brandVoiceAvoid?: string
  languages?: string[]
  strategy?: ClientStrategy
}): Promise<Client> {
  const id = input.id ?? nanoid(12)
  const now = Date.now()
  const strategy = input.strategy ?? createClientStrategy({
    type: input.type,
    name: input.name,
    city: input.city ?? '',
    positioning: input.description ?? '',
    tone: input.brandVoiceTone ?? '',
    offerFocus: '',
  })

  await db.execute({
    sql: `INSERT OR IGNORE INTO clients (
      id, name, type, city, status, emoji, color, description,
      brand_voice_tone, brand_voice_keywords, brand_voice_avoid,
      languages, strategy, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.name,
      input.type,
      input.city ?? null,
      input.emoji ?? '🏢',
      input.color ?? 'from-purple-600 to-purple-900',
      input.description ?? null,
      input.brandVoiceTone ?? null,
      input.brandVoiceKeywords ?? null,
      input.brandVoiceAvoid ?? null,
      JSON.stringify(input.languages ?? ['fr']),
      JSON.stringify(strategy),
      now,
      now,
    ],
  })

  const client = await getClient(id)
  if (!client) throw new Error('Failed to create client')
  return client
}

export async function updateClient(
  id: string,
  patch: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Client | null> {
  const now = Date.now()
  const updates: string[] = []
  const args: unknown[] = []

  const mapping: Record<string, string> = {
    name: 'name',
    type: 'type',
    city: 'city',
    status: 'status',
    emoji: 'emoji',
    color: 'color',
    description: 'description',
    brandVoiceTone: 'brand_voice_tone',
    brandVoiceKeywords: 'brand_voice_keywords',
    brandVoiceAvoid: 'brand_voice_avoid',
  }

  for (const [key, col] of Object.entries(mapping)) {
    if (key in patch) {
      updates.push(`${col} = ?`)
      args.push((patch as Record<string, unknown>)[key])
    }
  }

  if (patch.languages) {
    updates.push('languages = ?')
    args.push(JSON.stringify(patch.languages))
  }

  if (patch.strategy) {
    updates.push('strategy = ?')
    args.push(JSON.stringify(patch.strategy))
  }

  if (updates.length === 0) return getClient(id)

  updates.push('updated_at = ?')
  args.push(now)
  args.push(id)

  await db.execute({
    sql: `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
    args: args as never,
  })

  return getClient(id)
}

export async function searchClients(q: string): Promise<Client[]> {
  const like = `%${q}%`
  const rows = await query<ClientRow>(
    `SELECT * FROM clients WHERE name LIKE ? OR city LIKE ? OR description LIKE ? ORDER BY name ASC LIMIT 20`,
    [like, like, like]
  )
  return rows.map(mapRow)
}

export async function deleteClient(id: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM clients WHERE id = ?`,
    args: [id],
  })
}

export async function saveAiStrategy(id: string, strategy: unknown): Promise<void> {
  await db.execute({
    sql: `UPDATE clients SET ai_strategy = ?, updated_at = ? WHERE id = ?`,
    args: [JSON.stringify(strategy), Date.now(), id],
  })
}

export async function getAiStrategy(id: string): Promise<unknown | null> {
  const row = await queryOne<{ ai_strategy: string | null }>(
    `SELECT ai_strategy FROM clients WHERE id = ?`, [id]
  )
  if (!row?.ai_strategy) return null
  try { return JSON.parse(row.ai_strategy) } catch { return null }
}
