/**
 * Seed HORECA mock clients to populate the database on first run.
 * Idempotent: only seeds if clients table is empty.
 */
import { db } from './index'
import { createClient, listClients } from './queries/clients'

const SEED_CLIENTS = [
  {
    name: 'Le Bistrot de Marie',
    type: 'restaurant' as const,
    city: 'Lyon',
    emoji: '🍕',
    color: 'from-orange-600 to-red-700',
    description: 'Restaurant italien convivial · cuisine artisanale · pâte fermentée 72h',
    brandVoiceTone: 'Convivial, chaleureux, passionné',
    brandVoiceKeywords: 'authentique, fait maison, tradition italienne, savoir-faire',
    brandVoiceAvoid: 'corporate, froid, technique',
    languages: ['fr'],
  },
  {
    name: 'Hôtel des Vagues',
    type: 'hotel' as const,
    city: 'Biarritz',
    emoji: '🏖️',
    color: 'from-blue-600 to-cyan-700',
    description: 'Hôtel 4★ vue mer · spa · proche surf · clientèle internationale',
    brandVoiceTone: 'Élégant, raffiné, accueillant',
    brandVoiceKeywords: 'vue mer, bien-être, expérience, raffinement, océan',
    brandVoiceAvoid: 'familier, exagéré',
    languages: ['fr', 'en', 'es'],
  },
  {
    name: 'La Maison du Lac',
    type: 'bnb' as const,
    city: 'Annecy',
    emoji: '🏡',
    color: 'from-emerald-600 to-green-800',
    description: 'Chambres d\'hôte au bord du lac · accueil personnel · petit-déjeuner local',
    brandVoiceTone: 'Personnel, authentique, simple',
    brandVoiceKeywords: 'authenticité, lac, calme, fait maison, produits locaux',
    brandVoiceAvoid: 'marketing, luxe ostentatoire',
    languages: ['fr', 'en'],
  },
  {
    name: 'Bar Le Sud',
    type: 'bar' as const,
    city: 'Marseille',
    emoji: '🍸',
    color: 'from-purple-600 to-fuchsia-700',
    description: 'Bar à cocktails · ambiance méditerranéenne · DJ sets weekend',
    brandVoiceTone: 'Branché, dynamique, festif',
    brandVoiceKeywords: 'cocktail, soirée, ambiance, mixologie, méditerranée',
    brandVoiceAvoid: 'guindé, traditionnel',
    languages: ['fr'],
  },
  {
    name: 'Auberge des Pins',
    type: 'restaurant_hotel' as const,
    city: 'Aix-en-Provence',
    emoji: '🌲',
    color: 'from-amber-600 to-orange-700',
    description: 'Restaurant gastronomique + 12 chambres · cuisine provençale · jardin centenaire',
    brandVoiceTone: 'Authentique, généreux, raffiné',
    brandVoiceKeywords: 'Provence, terroir, gastronomie, jardin, tradition',
    brandVoiceAvoid: 'corporate, impersonnel',
    languages: ['fr', 'en'],
  },
  {
    name: 'Les Saveurs d\'Antoine',
    type: 'restaurant' as const,
    city: 'Bordeaux',
    emoji: '🥘',
    color: 'from-rose-600 to-pink-700',
    description: 'Restaurant bistronomique · cuisine du marché · cave à vins bordelais',
    brandVoiceTone: 'Passionné, technique, accessible',
    brandVoiceKeywords: 'marché, saison, vin, accord, créativité',
    brandVoiceAvoid: 'prétentieux, snob',
    languages: ['fr'],
  },
]

export async function seedIfEmpty() {
  const existing = await listClients()
  if (existing.length > 0) {
    console.log(`[seed] ${existing.length} clients existants — skip seed`)
    return
  }

  console.log('[seed] Insertion des clients HORECA mock...')
  for (const c of SEED_CLIENTS) {
    await createClient(c)
  }
  console.log(`[seed] ✓ ${SEED_CLIENTS.length} clients insérés`)
}

// Allow direct execution: `tsx lib/db/seed.ts`
if (require.main === module) {
  (async () => {
    const { initSchema } = await import('./schema')
    await initSchema()
    await seedIfEmpty()
    process.exit(0)
  })()
}
