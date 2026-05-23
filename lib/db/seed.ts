/**
 * Seed HORECA mock clients to populate the database on first run.
 * Idempotent: only seeds if clients table is empty.
 */
import { db } from './index'
import { createClient, listClients } from './queries/clients'
import type { ClientStrategy, ClientType } from '@/types/client'

interface SeedClient {
  name: string
  type: ClientType
  city: string
  emoji: string
  color: string
  description: string
  brandVoiceTone: string
  brandVoiceKeywords: string
  brandVoiceAvoid: string
  languages: string[]
  strategy: ClientStrategy
}

const SEED_CLIENTS: SeedClient[] = [
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
    strategy: {
      objective: 'Faire de Le Bistrot de Marie à Lyon le réflexe italien convivial du quartier, avec un focus sur la pâte fermentée 72h, les plats maison et les réservations du week-end.',
      contentPillars: ['Pâte fermentée 72h', 'Plat signature', 'Menu du jour', 'Coulisses', 'Réservation week-end'],
      platforms: ['instagram', 'facebook'],
      frequency: '4 posts/semaine',
      bestTimes: ['11:30', '18:30', '19:15'],
      avoid: ['contenu générique', 'promesses exagérées', 'ton robotique', 'ton luxe froid', 'visuels stock photo'],
    },
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
    strategy: {
      objective: 'Renforcer l\'attractivité de Hôtel des Vagues à Biarritz auprès des voyageurs mer, spa et surf, en convertissant les vues sociales en demandes de séjour qualifiées.',
      contentPillars: ['Chambres vue mer', 'Spa', 'Expérience locale', 'Petit-déjeuner', 'Avis client'],
      platforms: ['instagram', 'facebook'],
      frequency: '4 posts/semaine',
      bestTimes: ['08:30', '12:15', '18:00'],
      avoid: ['contenu générique', 'promesses exagérées', 'ton robotique', 'vocabulaire hôtel de chaîne', 'photos impersonnelles'],
    },
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
    strategy: {
      objective: 'Positionner La Maison du Lac à Annecy comme une chambre d\'hôte calme et personnelle, portée par le lac, l\'accueil direct et le petit-déjeuner local.',
      contentPillars: ['Vue lac', 'Petit-déjeuner local', 'Accueil maison', 'Expérience locale', 'Saisonnalité'],
      platforms: ['instagram', 'facebook'],
      frequency: '3 posts/semaine',
      bestTimes: ['08:30', '12:15', '18:00'],
      avoid: ['contenu générique', 'promesses exagérées', 'ton robotique', 'vocabulaire hôtel de chaîne', 'photos impersonnelles'],
    },
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
    strategy: {
      objective: 'Installer Bar Le Sud à Marseille comme le rendez-vous cocktails et DJ sets du week-end, avec une communication méditerranéenne, festive et locale.',
      contentPillars: ['Cocktail signature', 'Ambiance soirée', 'DJ sets', 'Happy hour', 'Clientèle locale'],
      platforms: ['instagram', 'facebook'],
      frequency: '5 posts/semaine',
      bestTimes: ['17:30', '20:00', '21:30'],
      avoid: ['contenu générique', 'promesses exagérées', 'ton robotique', 'ton institutionnel', 'visuels trop sages'],
    },
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
    strategy: {
      objective: 'Développer la notoriété de Auberge des Pins à Aix-en-Provence en reliant gastronomie provençale, jardin centenaire et séjours intimistes de 12 chambres.',
      contentPillars: ['Plat signature', 'Terroir provençal', 'Jardin centenaire', 'Chambres', 'Réservation week-end'],
      platforms: ['instagram', 'facebook'],
      frequency: '4 posts/semaine',
      bestTimes: ['11:30', '18:30', '19:15'],
      avoid: ['contenu générique', 'promesses exagérées', 'ton robotique', 'ton luxe froid', 'photos impersonnelles'],
    },
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
    strategy: {
      objective: 'Faire rayonner Les Saveurs d\'Antoine à Bordeaux comme une adresse bistronomique accessible, centrée sur le marché, la saison et les accords avec les vins bordelais.',
      contentPillars: ['Menu du marché', 'Accord mets-vins', 'Plat signature', 'Coulisses', 'Avis client'],
      platforms: ['instagram', 'facebook'],
      frequency: '4 posts/semaine',
      bestTimes: ['11:30', '18:30', '19:15'],
      avoid: ['contenu générique', 'promesses exagérées', 'ton robotique', 'ton luxe froid', 'visuels stock photo'],
    },
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
