import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

interface Check {
  ok: boolean
  label: string
  hint?: string
}

export async function GET() {
  const checks: Record<string, Check> = {
    anthropic: {
      ok: !!process.env.ANTHROPIC_API_KEY,
      label: 'ANTHROPIC_API_KEY',
      hint: 'Requis pour tous les agents IA (Claude Opus 4.7)',
    },
    openai: {
      ok: !!process.env.OPENAI_API_KEY,
      label: 'OPENAI_API_KEY',
      hint: 'Requis pour la génération d\'images (gpt-image-1)',
    },
    blob: {
      ok: !!process.env.BLOB_READ_WRITE_TOKEN,
      label: 'BLOB_READ_WRITE_TOKEN',
      hint: 'Requis en production pour stocker les fichiers (Vercel Blob). Sans ça les images générées crashent.',
    },
    database: {
      ok: true,
      label: 'Base de données',
    },
    turso: {
      ok: !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')),
      label: 'DATABASE_URL (Turso)',
      hint: 'En production, utiliser une URL Turso (libsql://...) + DATABASE_AUTH_TOKEN pour la persistance.',
    },
    luma: {
      ok: !!process.env.LUMA_API_KEY,
      label: 'LUMA_API_KEY',
      hint: 'Optionnel — requis uniquement pour la création de reels (Video Creator agent).',
    },
  }

  // DB connectivity check
  try {
    await queryOne('SELECT 1')
    checks.database.ok = true
    checks.database.label = process.env.DATABASE_URL?.startsWith('file:')
      ? 'Base de données (locale)'
      : 'Base de données (Turso)'
  } catch (err) {
    checks.database.ok = false
    checks.database.hint = err instanceof Error ? err.message : 'Connexion DB échouée'
  }

  const allOk = Object.values(checks).every(c => c.ok)
  const criticalFailing = ['anthropic', 'openai', 'database'].filter(k => !checks[k].ok)

  return NextResponse.json(
    {
      ok: allOk,
      critical: criticalFailing.length === 0,
      checks,
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
    },
    { status: allOk ? 200 : 207 }
  )
}
