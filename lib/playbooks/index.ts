import type { ClientType } from '@/types/client'
import type { VerticalPlaybook } from './types'

const sharedAvoid = ['contenu générique', 'promesses exagérées', 'ton robotique']

const restaurantPillars = ['Plat signature', 'Menu du jour', 'Coulisses', 'Avis client', 'Réservation week-end']
const hotelPillars = ['Chambres', 'Expérience locale', 'Petit-déjeuner', 'Saisonnalité', 'Avis client']

export const VERTICAL_PLAYBOOKS: Record<string, VerticalPlaybook> = {
  restaurant: {
    vertical: 'restaurant',
    label: 'Restaurant',
    emoji: '🍴',
    legacyType: 'restaurant',
    strategy: {
      contentPillars: restaurantPillars,
      frequency: '4 posts/semaine',
      bestTimes: ['11:30', '18:30', '19:15'],
      avoid: [...sharedAvoid, 'ton luxe froid', 'visuels stock photo'],
    },
    businessObjectives: ['increase_bookings', 'fill_slow_days', 'sell_offer', 'get_google_reviews'],
    priorityChannels: ['phone', 'instagram_dm', 'facebook_dm', 'google_maps', 'website'],
    campaignTemplates: [
      {
        id: 'fill-weeknight',
        name: 'Remplir un soir creux',
        objective: 'fill_slow_days',
        duration: '2 semaines',
        postCount: 4,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Mettre en avant une offre ou un plat qui donne une raison concrète de réserver sur un créneau faible.',
        kpis: ['Réservations', 'Appels', 'DM', 'Clics itinéraire'],
      },
    ],
    kpis: ['Réservations', 'Appels', 'DM', 'Avis Google', 'Clics itinéraire'],
    commonMistakes: ['Publier seulement des plats sans humain', 'CTA trop vague', 'Trop de promotions répétées'],
    promptContext: 'Restaurant local : alterner plat signature, coulisses, avis client et réservation. Priorité à la réservation, aux appels et à la preuve sociale locale.',
  },
  hotel: {
    vertical: 'hotel',
    label: 'Hôtel',
    emoji: '🏨',
    legacyType: 'hotel',
    strategy: {
      contentPillars: hotelPillars,
      frequency: '4 posts/semaine',
      bestTimes: ['08:30', '12:15', '18:00'],
      avoid: [...sharedAvoid, 'vocabulaire hôtel de chaîne', 'photos impersonnelles'],
    },
    businessObjectives: ['increase_bookings', 'reduce_platform_dependency', 'improve_google_maps_visibility', 'get_google_reviews'],
    priorityChannels: ['website', 'phone', 'google_maps', 'instagram_dm', 'booking_platform'],
    campaignTemplates: [
      {
        id: 'direct-booking',
        name: 'Réservations directes',
        objective: 'reduce_platform_dependency',
        duration: '1 mois',
        postCount: 6,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Créer du désir autour de l’expérience et pousser la réservation directe avec un avantage clair.',
        kpis: ['Clics site', 'Appels', 'Réservations directes'],
      },
    ],
    kpis: ['Réservations directes', 'Appels', 'Clics site', 'Avis Google', 'Taux occupation'],
    commonMistakes: ['Trop de chambres vides', 'Ne pas montrer l’expérience locale', 'CTA sans réservation directe'],
    promptContext: 'Hôtel : vendre une expérience, pas seulement une chambre. Montrer ambiance, services, localisation et preuve sociale pour augmenter les réservations directes.',
  },
  bar: {
    vertical: 'bar',
    label: 'Bar',
    emoji: '🍸',
    legacyType: 'bar',
    strategy: {
      contentPillars: ['Cocktail signature', 'Ambiance soirée', 'Happy hour', 'Événement', 'Clientèle locale'],
      frequency: '5 posts/semaine',
      bestTimes: ['17:30', '20:00', '21:30'],
      avoid: [...sharedAvoid, 'ton institutionnel', 'visuels trop sages'],
    },
    businessObjectives: ['fill_slow_days', 'promote_event', 'increase_dms', 'attract_new_customers'],
    priorityChannels: ['instagram_dm', 'facebook_dm', 'phone', 'google_maps'],
    campaignTemplates: [
      {
        id: 'afterwork',
        name: 'Afterwork local',
        objective: 'fill_slow_days',
        duration: '2 semaines',
        postCount: 5,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Créer une campagne autour d’un moment précis : afterwork, cocktail signature, ambiance et invitation à venir en groupe.',
        kpis: ['DM', 'Appels', 'Présence événement', 'Reach local'],
      },
    ],
    kpis: ['DM', 'Appels', 'Présence événement', 'Avis Google', 'Reach local'],
    commonMistakes: ['Photos trop statiques', 'Pas de moment clair', 'Promesse happy hour non cadrée'],
    promptContext: 'Bar : priorité aux moments de consommation, à l’ambiance et aux créneaux jeudi-vendredi. Le contenu doit donner envie de venir maintenant ou avec un groupe.',
  },
  bnb: {
    vertical: 'bnb',
    label: "Chambre d'hôte",
    emoji: '🏡',
    legacyType: 'bnb',
    strategy: {
      contentPillars: hotelPillars,
      frequency: '3 posts/semaine',
      bestTimes: ['08:30', '12:15', '18:00'],
      avoid: [...sharedAvoid, 'vocabulaire hôtel de chaîne', 'photos impersonnelles'],
    },
    businessObjectives: ['increase_bookings', 'reduce_platform_dependency', 'get_google_reviews', 'attract_new_customers'],
    priorityChannels: ['website', 'phone', 'instagram_dm', 'google_maps', 'booking_platform'],
    campaignTemplates: [
      {
        id: 'low-season',
        name: 'Basse saison',
        objective: 'increase_bookings',
        duration: '1 mois',
        postCount: 6,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Mettre en avant le calme, l’expérience locale et une raison de réserver hors saison.',
        kpis: ['Réservations', 'Clics site', 'Messages', 'Avis Google'],
      },
    ],
    kpis: ['Réservations directes', 'Messages', 'Clics site', 'Avis Google'],
    commonMistakes: ['Trop parler de prix', 'Ne pas montrer le cadre', 'Ignorer les activités locales'],
    promptContext: 'B&B : vendre le rêve, l’accueil et le cadre avant le prix. Favoriser réservations directes, témoignages et expériences locales.',
  },
  coiffeur: {
    vertical: 'coiffeur',
    label: 'Coiffeur',
    emoji: '✂️',
    legacyType: 'bar',
    strategy: {
      contentPillars: ['Avant / après', 'Transformation couleur', 'Disponibilités semaine', 'Conseil entretien', 'Avis client'],
      frequency: '4 posts/semaine',
      bestTimes: ['09:00', '12:30', '18:00'],
      avoid: [...sharedAvoid, 'promesse résultat irréaliste', 'avant/après non autorisé'],
    },
    businessObjectives: ['increase_bookings', 'fill_slow_days', 'sell_offer', 'get_google_reviews'],
    priorityChannels: ['phone', 'whatsapp', 'instagram_dm', 'google_maps'],
    campaignTemplates: [
      {
        id: 'monday-slots',
        name: 'Remplir les créneaux faibles',
        objective: 'fill_slow_days',
        duration: '2 semaines',
        postCount: 4,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Mettre en avant une disponibilité ou une prestation précise avec preuve visuelle et CTA prise de rendez-vous.',
        kpis: ['Rendez-vous', 'Appels', 'Messages', 'Avis Google'],
      },
    ],
    kpis: ['Rendez-vous', 'Appels', 'Messages', 'Avis Google', 'Clients première visite'],
    commonMistakes: ['Publier sans avant/après', 'Oublier le CTA rendez-vous', 'Promettre un résultat sans diagnostic'],
    promptContext: 'Salon de coiffure : vendre la transformation, la confiance et la disponibilité. Utiliser avant/après, conseils entretien, preuves clients et CTA rendez-vous.',
  },
  'salle-de-sport': {
    vertical: 'salle-de-sport',
    label: 'Salle de sport',
    emoji: '🏋️',
    legacyType: 'bar',
    strategy: {
      contentPillars: ['Essai gratuit', 'Transformation membre', 'Cours collectif', 'Challenge', 'Coaching personnel'],
      frequency: '5 posts/semaine',
      bestTimes: ['07:30', '12:00', '18:30'],
      avoid: [...sharedAvoid, 'promesses santé non prouvées', 'culpabilisation'],
    },
    businessObjectives: ['sell_membership', 'attract_new_customers', 'promote_event', 'increase_dms'],
    priorityChannels: ['website', 'instagram_dm', 'phone', 'walk_in'],
    campaignTemplates: [
      {
        id: 'trial-week',
        name: 'Semaine essai',
        objective: 'sell_membership',
        duration: '2 semaines',
        postCount: 6,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Promouvoir une offre essai ou un challenge court avec preuve sociale et CTA inscription.',
        kpis: ['Essais réservés', 'Messages', 'Inscriptions', 'Passages'],
      },
    ],
    kpis: ['Essais réservés', 'Inscriptions', 'Messages', 'Passages', 'Taux conversion'],
    commonMistakes: ['Trop parler de machines', 'Promesses physiques irréalistes', 'Oublier la communauté'],
    promptContext: 'Salle de sport : vendre l’engagement, la communauté et le passage à l’action. Priorité essai, abonnement, challenge et preuve sociale.',
  },
  padel: {
    vertical: 'padel',
    label: 'Padel',
    emoji: '🎾',
    legacyType: 'bar',
    strategy: {
      contentPillars: ['Créneaux disponibles', 'Tournois', 'Cours débutants', 'Afterwork', 'Offres groupes'],
      frequency: '4 posts/semaine',
      bestTimes: ['11:30', '17:30', '20:00'],
      avoid: [...sharedAvoid, 'jargon trop technique', 'créneaux sans CTA réservation'],
    },
    businessObjectives: ['increase_bookings', 'promote_event', 'sell_membership', 'fill_slow_days'],
    priorityChannels: ['website', 'phone', 'whatsapp', 'instagram_dm'],
    campaignTemplates: [
      {
        id: 'afterwork-padel',
        name: 'Afterwork padel',
        objective: 'fill_slow_days',
        duration: '2 semaines',
        postCount: 5,
        platforms: ['instagram', 'facebook'],
        briefTemplate: 'Remplir des créneaux afterwork avec un angle groupe, fun et réservation simple.',
        kpis: ['Réservations terrains', 'Messages', 'Inscriptions tournoi'],
      },
    ],
    kpis: ['Réservations terrains', 'Inscriptions tournoi', 'Messages', 'Abonnements'],
    commonMistakes: ['Ne parler qu’aux joueurs experts', 'Oublier les débutants', 'CTA réservation absent'],
    promptContext: 'Padel : vendre le jeu social, les créneaux, les tournois et les offres groupes. Toujours rendre la réservation évidente.',
  },
}

export const DEFAULT_PLAYBOOK: VerticalPlaybook = {
  vertical: 'commerce-local',
  label: 'Commerce local',
  emoji: '🏬',
  legacyType: 'restaurant',
  strategy: {
    contentPillars: ['Offre phare', 'Preuve client', 'Coulisses', 'Disponibilités', 'Avis Google'],
    frequency: '3 posts/semaine',
    bestTimes: ['09:00', '12:30', '18:00'],
    avoid: sharedAvoid,
  },
  businessObjectives: ['attract_new_customers', 'increase_calls', 'sell_offer', 'get_google_reviews'],
  priorityChannels: ['phone', 'google_maps', 'instagram_dm', 'facebook_dm'],
  campaignTemplates: [
    {
      id: 'local-discovery',
      name: 'Découverte locale',
      objective: 'attract_new_customers',
      duration: '1 mois',
      postCount: 6,
      platforms: ['instagram', 'facebook'],
      briefTemplate: 'Faire découvrir l’offre principale du commerce avec preuve sociale, localisation et CTA simple.',
      kpis: ['Appels', 'Messages', 'Passages', 'Avis Google'],
    },
  ],
  kpis: ['Appels', 'Messages', 'Passages', 'Avis Google', 'Clics itinéraire'],
  commonMistakes: ['Contenu trop générique', 'Pas de preuve sociale', 'CTA absent'],
  promptContext: 'Commerce physique local : clarifier l’offre, prouver la confiance, donner une raison de venir ou contacter, et mesurer appels/messages/passages.',
}

export function getPlaybook(vertical?: string | null): VerticalPlaybook {
  if (!vertical) return DEFAULT_PLAYBOOK
  return VERTICAL_PLAYBOOKS[vertical] ?? DEFAULT_PLAYBOOK
}

export function getPlaybookForLegacyType(type: ClientType): VerticalPlaybook {
  return getPlaybook(type)
}

export const VERTICAL_OPTIONS = Object.values(VERTICAL_PLAYBOOKS)
