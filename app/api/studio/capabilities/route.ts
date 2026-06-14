import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    lumaEnabled: Boolean(process.env.LUMA_API_KEY),
    imageModel: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
  })
}
