import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'
import type { Client, ClientType, ClientWithStats, ClientStatus } from '@/types/client'

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
  created_at: number
  updated_at: number
}

function mapRow(row: ClientRow): Client {
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
  // For now, stats are mocked. Will plug real analytics later.
  return clients.map(c => ({
    ...c,
    postsThisMonth: Math.floor(Math.random() * 40) + 10,
    engagement: parseFloat((Math.random() * 5 + 3).toFixed(1)),
    agentsCount: Math.floor(Math.random() * 4) + 2,
    connectedPlatforms: Math.floor(Math.random() * 3) + 1,
  }))
}

export async function getClient(id: string): Promise<Client | null> {
  const row = await queryOne<ClientRow>(
    `SELECT * FROM clients WHERE id = ?`,
    [id]
  )
  return row ? mapRow(row) : null
}

export async function createClient(input: {
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
}): Promise<Client> {
  const id = nanoid(12)
  const now = Date.now()

  await db.execute({
    sql: `INSERT INTO clients (
      id, name, type, city, status, emoji, color, description,
      brand_voice_tone, brand_voice_keywords, brand_voice_avoid,
      languages, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

export async function deleteClient(id: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM clients WHERE id = ?`,
    args: [id],
  })
}
