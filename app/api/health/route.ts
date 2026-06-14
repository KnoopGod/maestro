import { NextResponse } from 'next/server'
import { dbConfig, queryOne } from '@/lib/db'

interface Check {
  ok: boolean
  label: string
  hint?: string
  required?: boolean
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
    meta: {
      ok: !!(process.env.META_APP_ID && process.env.META_APP_SECRET),
      label: 'META_APP_ID + META_APP_SECRET',
      hint: 'Requis pour convertir les User Tokens Meta en tokens longue durée fiables.',
    },
    encryption: {
      ok: !!process.env.MAESTRO_ENCRYPTION_KEY,
      label: 'MAESTRO_ENCRYPTION_KEY',
      hint: 'Requis pour chiffrer les nouveaux tokens Meta en base. À définir avant de reconnecter les comptes clients.',
    },
    publicMedia: {
      ok: !!(
        process.env.BLOB_READ_WRITE_TOKEN ||
        (process.env.CODEXRS_PUBLIC_URL && !/localhost|127\.0\.0\.1/.test(process.env.CODEXRS_PUBLIC_URL))
      ),
      label: 'Médias publics HTTPS',
      hint: 'Requis pour publier des images sur Instagram. Utiliser Vercel Blob ou CODEXRS_PUBLIC_URL public.',
    },
    database: {
      ok: true,
      label: 'Base de données',
    },
    turso: {
      ok: !dbConfig.isLocalDb,
      label: 'DATABASE_URL (Turso)',
      hint: 'En production, utiliser une URL Turso (libsql://...) + DATABASE_AUTH_TOKEN pour la persistance.',
    },
    luma: {
      ok: !!process.env.LUMA_API_KEY,
      label: 'LUMA_API_KEY',
      hint: 'Optionnel — requis uniquement pour la création de reels (Video Creator agent).',
      required: false,
    },
  }

  // DB connectivity check
  try {
    await queryOne('SELECT 1')
    checks.database.ok = true
    checks.database.label = dbConfig.isLocalDb
      ? 'Base de données (locale)'
      : 'Base de données (Turso)'
  } catch (err) {
    checks.database.ok = false
    checks.database.hint = err instanceof Error ? err.message : 'Connexion DB échouée'
  }

  const allOk = Object.values(checks).every(c => c.required === false || c.ok)
  const criticalFailing = ['anthropic', 'openai', 'database', 'encryption'].filter(k => !checks[k].ok)

  return NextResponse.json(
    {
      ok: allOk,
      critical: criticalFailing.length === 0,
      checks,
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      db: {
        isLocal: dbConfig.isLocalDb,
        schemaAutoInit: dbConfig.schemaAutoInit,
      },
    },
    { status: allOk ? 200 : 207 }
  )
}
