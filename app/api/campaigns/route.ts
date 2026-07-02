import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { createCampaign, listCampaigns, updateCampaign } from '@/lib/db/queries/campaigns'
import { runMediaPlanner } from '@/lib/agents/media-planner'
import { BUSINESS_OBJECTIVES, type BusinessObjective } from '@/types/client'
import type { CampaignChannel, CampaignStatus } from '@/types/campaign'

export const dynamic = 'force-dynamic'
// Un seul appel IA (~10-20 s), pas de génération d'image : le mode synchrone est acceptable.
export const maxDuration = 60

const ALLOWED_CHANNELS = new Set<CampaignChannel>(['meta_ads', 'google_ads'])
const ALLOWED_STATUS = new Set<CampaignStatus>(['draft', 'active', 'paused', 'completed'])

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId') ?? undefined
  const statusParam = req.nextUrl.searchParams.get('status')
  const status = statusParam && ALLOWED_STATUS.has(statusParam as CampaignStatus)
    ? (statusParam as CampaignStatus)
    : undefined

  const campaigns = await listCampaigns({ clientId, status })
  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clientId = String(body.clientId ?? '').trim()
    const name = String(body.name ?? '').trim()
    const channel = String(body.channel ?? '') as CampaignChannel
    const objective = String(body.objective ?? '') as BusinessObjective
    const budgetEur = Number(body.budgetEur)
    const brief = String(body.brief ?? '').trim()
    const startAt = typeof body.startAt === 'number' ? body.startAt : null
    const endAt = typeof body.endAt === 'number' ? body.endAt : null

    if (!clientId || !name) {
      return NextResponse.json({ error: 'clientId et name sont requis' }, { status: 400 })
    }
    if (!ALLOWED_CHANNELS.has(channel)) {
      return NextResponse.json({ error: 'channel invalide (meta_ads | google_ads)' }, { status: 400 })
    }
    if (!(objective in BUSINESS_OBJECTIVES)) {
      return NextResponse.json({ error: 'objective invalide' }, { status: 400 })
    }
    if (!Number.isFinite(budgetEur) || budgetEur <= 0) {
      return NextResponse.json({ error: 'budgetEur doit être un nombre positif' }, { status: 400 })
    }

    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const campaign = await createCampaign({ clientId, name, channel, objective, budgetEur, startAt, endAt, brief })

    const durationDays = startAt && endAt && endAt > startAt
      ? Math.max(1, Math.round((endAt - startAt) / (24 * 60 * 60 * 1000)))
      : 30

    const result = await runMediaPlanner({ client, channel, objective, budgetEur, brief, durationDays })
    const updated = await updateCampaign(campaign.id, { mediaPlan: result.plan, addCost: result.cost })

    return NextResponse.json({ campaign: updated ?? campaign, model: result.model }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur création campagne' },
      { status: 500 }
    )
  }
}
