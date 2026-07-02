import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'
import type { Campaign, CampaignChannel, CampaignStatus, CampaignResults, MediaPlan } from '@/types/campaign'
import type { BusinessObjective } from '@/types/client'

interface CampaignRow {
  id: string
  client_id: string
  name: string
  channel: CampaignChannel
  objective: BusinessObjective
  budget_eur: number
  start_at: number | null
  end_at: number | null
  status: CampaignStatus
  brief: string
  media_plan: string | null
  results: string | null
  cost: number
  created_at: number
  updated_at: number
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function mapRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    channel: row.channel,
    objective: row.objective,
    budgetEur: row.budget_eur,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    brief: row.brief,
    mediaPlan: parseJson<MediaPlan>(row.media_plan),
    results: parseJson<CampaignResults>(row.results),
    cost: row.cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createCampaign(input: {
  clientId: string
  name: string
  channel: CampaignChannel
  objective: BusinessObjective
  budgetEur: number
  startAt?: number | null
  endAt?: number | null
  brief: string
}): Promise<Campaign> {
  const id = nanoid(12)
  const now = Date.now()

  await db.execute({
    sql: `INSERT INTO campaigns (
      id, client_id, name, channel, objective, budget_eur,
      start_at, end_at, status, brief, cost, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0, ?, ?)`,
    args: [
      id, input.clientId, input.name, input.channel, input.objective, input.budgetEur,
      input.startAt ?? null, input.endAt ?? null, input.brief, now, now,
    ],
  })

  const campaign = await getCampaign(id)
  if (!campaign) throw new Error('Failed to create campaign')
  return campaign
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const row = await queryOne<CampaignRow>(`SELECT * FROM campaigns WHERE id = ?`, [id])
  return row ? mapRow(row) : null
}

export async function listCampaigns(options: {
  clientId?: string
  status?: CampaignStatus
  limit?: number
} = {}): Promise<Campaign[]> {
  const clauses: string[] = []
  const args: (string | number)[] = []

  if (options.clientId) {
    clauses.push('client_id = ?')
    args.push(options.clientId)
  }
  if (options.status) {
    clauses.push('status = ?')
    args.push(options.status)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const limit = options.limit ?? 100
  args.push(limit)

  const rows = await query<CampaignRow>(
    `SELECT * FROM campaigns ${where} ORDER BY created_at DESC LIMIT ?`,
    args
  )
  return rows.map(mapRow)
}

export async function updateCampaign(id: string, patch: {
  name?: string
  status?: CampaignStatus
  budgetEur?: number
  startAt?: number | null
  endAt?: number | null
  brief?: string
  mediaPlan?: MediaPlan | null
  /** Coût IA additionnel (régénération) — s'additionne au coût existant. */
  addCost?: number
}): Promise<Campaign | null> {
  const sets: string[] = []
  const args: (string | number | null)[] = []

  if (patch.name !== undefined) { sets.push('name = ?'); args.push(patch.name) }
  if (patch.status !== undefined) { sets.push('status = ?'); args.push(patch.status) }
  if (patch.budgetEur !== undefined) { sets.push('budget_eur = ?'); args.push(patch.budgetEur) }
  if (patch.startAt !== undefined) { sets.push('start_at = ?'); args.push(patch.startAt) }
  if (patch.endAt !== undefined) { sets.push('end_at = ?'); args.push(patch.endAt) }
  if (patch.brief !== undefined) { sets.push('brief = ?'); args.push(patch.brief) }
  if (patch.mediaPlan !== undefined) { sets.push('media_plan = ?'); args.push(patch.mediaPlan ? JSON.stringify(patch.mediaPlan) : null) }
  if (patch.addCost !== undefined) { sets.push('cost = cost + ?'); args.push(patch.addCost) }

  if (sets.length === 0) return getCampaign(id)

  sets.push('updated_at = ?')
  args.push(Date.now())
  args.push(id)

  await db.execute({
    sql: `UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`,
    args,
  })
  return getCampaign(id)
}

export async function saveCampaignResults(id: string, results: Omit<CampaignResults, 'updatedAt'>): Promise<Campaign | null> {
  const payload: CampaignResults = { ...results, updatedAt: Date.now() }
  await db.execute({
    sql: `UPDATE campaigns SET results = ?, updated_at = ? WHERE id = ?`,
    args: [JSON.stringify(payload), Date.now(), id],
  })
  return getCampaign(id)
}

export async function deleteCampaign(id: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM campaigns WHERE id = ?`, args: [id] })
}
