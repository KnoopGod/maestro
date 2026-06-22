import { NextResponse } from 'next/server'
import { AGENT_MODELS } from '@/lib/agents/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    lumaEnabled: Boolean(process.env.LUMA_API_KEY),
    imageModel: AGENT_MODELS.image,
  })
}
