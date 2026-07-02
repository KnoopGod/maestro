import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { getCampaign, updateCampaign, saveCampaignResults, deleteCampaign } from '@/lib/db/queries/campaigns'
import { runMediaPlanner } from '@/lib/agents/media-planner'
import type { CampaignStatus } from '@/types/campaign'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALLOWED_STATUS = new Set<CampaignStatus>(['draft', 'active', 'paused', 'completed'])

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaign = await getCampaign(id)
  if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
  return NextResponse.json({ campaign })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = await getCampaign(id)
    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const body = await req.json()

    // Action : régénérer le plan média (écrase le plan, additionne le coût IA)
    if (body.action === 'regenerate') {
      const client = await getClient(campaign.clientId)
      if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

      const durationDays = campaign.startAt && campaign.endAt && campaign.endAt > campaign.startAt
        ? Math.max(1, Math.round((campaign.endAt - campaign.startAt) / (24 * 60 * 60 * 1000)))
        : 30

      const result = await runMediaPlanner({
        client,
        channel: campaign.channel,
        objective: campaign.objective,
        budgetEur: campaign.budgetEur,
        brief: campaign.brief,
        durationDays,
      })
      const updated = await updateCampaign(id, { mediaPlan: result.plan, addCost: result.cost })
      return NextResponse.json({ campaign: updated, model: result.model })
    }

    // Saisie des résultats (depuis Ads Manager / Google Ads)
    if (body.results && typeof body.results === 'object') {
      const r = body.results
      const updated = await saveCampaignResults(id, {
        spendEur: toNullableNumber(r.spendEur),
        impressions: toNullableNumber(r.impressions),
        clicks: toNullableNumber(r.clicks),
        leads: toNullableNumber(r.leads),
        revenueEur: toNullableNumber(r.revenueEur),
        notes: typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim() : null,
      })
      return NextResponse.json({ campaign: updated })
    }

    // Mise à jour de champs simples
    const patch: Parameters<typeof updateCampaign>[1] = {}
    if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
    if (typeof body.status === 'string' && ALLOWED_STATUS.has(body.status as CampaignStatus)) {
      patch.status = body.status as CampaignStatus
    }
    if (body.budgetEur !== undefined) {
      const budget = Number(body.budgetEur)
      if (Number.isFinite(budget) && budget > 0) patch.budgetEur = budget
    }
    if (typeof body.brief === 'string') patch.brief = body.brief.trim()

    const updated = await updateCampaign(id, patch)
    return NextResponse.json({ campaign: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur mise à jour campagne' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaign = await getCampaign(id)
  if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
  await deleteCampaign(id)
  return NextResponse.json({ success: true })
}
