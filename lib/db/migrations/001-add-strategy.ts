import { db, query } from '../index'
import { createClientStrategy } from '@/lib/agents/strategy-director'
import type { ClientType } from '@/types/client'

interface StrategyBackfillRow {
  id: string
  name: string
  type: ClientType
  city: string | null
  description: string | null
  brand_voice_tone: string | null
  strategy: string | null
}

export async function backfillClientStrategies() {
  const rows = await query<StrategyBackfillRow>(`
    SELECT id, name, type, city, description, brand_voice_tone, strategy
    FROM clients
    WHERE strategy IS NULL OR strategy = ''
  `)

  for (const row of rows) {
    const strategy = createClientStrategy({
      type: row.type,
      name: row.name,
      city: row.city ?? '',
      positioning: row.description ?? '',
      tone: row.brand_voice_tone ?? '',
      offerFocus: '',
    })

    await db.execute({
      sql: `UPDATE clients SET strategy = ?, updated_at = ? WHERE id = ?`,
      args: [JSON.stringify(strategy), Date.now(), row.id],
    })
  }

  return rows.length
}

if (require.main === module) {
  backfillClientStrategies()
    .then(count => {
      console.log(`[migration:001-add-strategy] ${count} clients backfilled`)
      process.exit(0)
    })
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}
