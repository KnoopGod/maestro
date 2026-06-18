import type { VerticalPlaybook } from './types'

export const hotel: VerticalPlaybook = {
  vertical: 'hotel',
  label: 'Hôtel',
  emoji: '🏨',
  dbType: 'hotel',
  color: 'from-blue-600 to-cyan-700',
  businessObjectives: [
    'increase_bookings',
    'reduce_platform_dependency',
    'attract_new_customers',
    'increase_visibility',
    'fill_slow_days',
    'get_google_reviews',
  ],
  contentPillars: [
    'Chambre lifestyle avec ambiance',
    'Vue et environnement immersif',
    'Expériences locales et activités',
    'Petit-déjeuner et art de vivre',
    'Témoignage et preuve sociale',
    'Offre directe et avantage réservation',
    'Événement et occasion spéciale',
    'Basse saison et disponibilités',
  ],
  peakDays: ['mardi', 'mercredi'],
  offDays: ['lundi', 'dimanche'],
  bestPostingTimes: ['08:30', '12:00', '18:00', '20:00'],
  conversionChannels: ['website', 'email', 'phone', 'booking_platform', 'google_maps'],
  campaignTemplates: [
    {
      id: 'hotel-reservation-directe',
      name: 'Offre réservation directe',
      objective: 'reduce_platform_dependency',
      duration: '1 mois',
      postCount: 8,
      description:
        "Mettre en avant les avantages exclusifs de la réservation directe vs Booking.com : petit-déjeuner offert, upgrade chambre, flexibilité d'annulation",
      briefTemplate:
        'Réserver directement sur [site] = [avantage 1 : petit-déjeuner inclus / late check-out / upgrade]. Même chambre, meilleur prix. Lien direct en bio. Éviter "meilleur prix garanti" sans preuve.',
    },
    {
      id: 'hotel-escapade-basse-saison',
      name: 'Escapade basse saison',
      objective: 'fill_slow_days',
      duration: '3 semaines',
      postCount: 6,
      description:
        "Posts qui transforment la basse saison en avantage : moins de monde, prix doux, authenticité — pour attirer les voyageurs hors-saison",
      briefTemplate:
        '[Mois creux] à [nom hôtel] : [avantage basse saison — tranquillité, prix -X%, accès activité locale]. Idéal pour [cible — couple, solo, télétravail]. Dispo à partir de [date]. Réserver au [lien/tel].',
    },
    {
      id: 'hotel-coffret-cadeau',
      name: 'Coffret cadeau séjour',
      objective: 'increase_revenue_period',
      duration: '4 semaines (avant fêtes)',
      postCount: 5,
      description:
        "Promouvoir les coffrets cadeaux séjour pour les fêtes, anniversaires et événements — produit à forte marge et acquisition de nouveaux clients",
      briefTemplate:
        'Offrez [X nuits à nom hôtel] pour [occasion — Noël, anniversaire, fête des mères]. Coffret [formule] à [prix]€ : chambre [type] + [inclus]. Commande par [lien/DM/tel]. Valable [durée].',
    },
    {
      id: 'hotel-weekend-thematique',
      name: 'Week-end thématique',
      objective: 'attract_new_customers',
      duration: '2 semaines',
      postCount: 5,
      description:
        "Créer un week-end à thème (gastronomie, bien-être, randonnée, culture) pour sortir de la logique 'hôtel générique' et attirer une audience qualifiée",
      briefTemplate:
        'Week-end [thème] à [nom hôtel] — [dates]. Programme : [activité 1], [activité 2], [repas ou dégustation]. [Nb] chambres disponibles. Tarif [prix]€/nuit. Réservation [lien/tel].',
    },
  ],
  primaryKpis: [
    "Taux d'occupation direct vs OTA (Booking.com, Expedia)",
    'Revenue par chambre disponible (RevPAR)',
    "Coût d'acquisition par réservation directe vs Booking.com (commission 15-25%)",
    'Avis Google et Booking.com (note + volume mensuel)',
    'Taux de conversion site web (visiteurs → réservations)',
  ],
  promptContext: `Tu travailles pour un HÔTEL. Voici l'expertise terrain pour ce secteur :

TIMING PRÉCIS — LA FENÊTRE DE RÉSERVATION HÔTELIÈRE :
- Loisirs : décision 3-4 semaines avant → posts mardi-mercredi pour week-end suivant
- Business : décision 5-7 jours avant → posts lundi-mardi pour semaine suivante
- Last-minute basse saison : story jeudi soir → "Ce week-end, il reste 2 chambres"
- 8h30 : consultation mobile au réveil → visuels chambre ambiance "matin de rêve"
- 20h00 : planification soirée/week-end → posts lifestyle, escapade, romantique

RÈGLE D'OR VISUELLE — JAMAIS UNE CHAMBRE VIDE :
- Chambre vide = catalogue Ikea = zéro désir = zéro réservation
- TOUJOURS mise en scène : plateau petit-déjeuner sur le lit, valise ouverte, livre et tasse de café, couple (flou) au balcon, robe de chambre sur le fauteuil
- La vue depuis la chambre > la chambre elle-même → "Ce que vous verrez en ouvrant les yeux"
- Détails sensoriels > vue d'ensemble : oreillers moelleux, lumière dorée du matin, carreaux de la salle de bain, serviette pliée en cygne

STRATÉGIE ANTI-OTA — ARGUMENTAIRE QUI CONVERTIT :
- "Réservez directement = petit-déjeuner inclus pour 2" (valeur tangible perçue)
- "Annulation gratuite jusqu'à 48h — sans frais Booking" (transparence vs opacité OTA)
- "Demandez votre chambre préférée — impossible sur Booking" (personnalisation)
- "Tarif direct = tarif Booking — sans commission qui finance leur pub" (pédagogie)
- Ne JAMAIS mentir sur le prix (parité tarifaire OTA = obligation contractuelle souvent)

CONTENU PAR TYPE DE VOYAGEUR (cibler dans les captions) :
- Couple romantique : "Déconnectez-vous enfin" → chambre avec vue, dîner aux chandelles, bain moussant
- Famille : "Vos enfants n'oublieront pas" → espace, activités, petit-déjeuner généreux
- Business / télétravail : "Travaillez mieux loin du bureau" → WiFi, bureau, calme, espresso matinal
- Solo aventurier : "Base parfaite pour explorer [région]" → localisation, conseils, carte

HASHTAGS HÔTEL (par efficacité) :
1. Géolocalisés : #hotel[ville] #sejour[région] #voyage[pays]
2. Lifestyle : #escapadeweekend #hotelboutique #luxeabordable #weekendamoureux
3. Circonstanciels : #noel2025 #saint-valentin #vacancesete
4. À proscrire : #hotel #travel #vacation (trop génériques, portée nulle)

SAISONNALITÉ — CONTENU PAR PÉRIODE :
- Janvier-février : Saint-Valentin (réservations 3-4 sem à l'avance), escapades hivernales
- Mars-avril : Pâques, première terrasse, printemps
- Mai-juin : fêtes (mères, pères), mariages, escapades pré-été
- Juillet-août : haute saison → posts "dernières chambres", témoignages vacanciers
- Septembre-octobre : couleurs d'automne, calme retrouvé, offres basse saison
- Novembre-décembre : Noël, réveillons, coffrets cadeaux → 30% du CA annuel pour certains hôtels

OBJECTIF BUSINESS PRINCIPAL : réduire la dépendance aux OTAs et maximiser les réservations directes`,

  commonMistakes: [
    "Chambre vide = mort commercial : TOUJOURS mise en scène avec objet ou ambiance",
    "Pousser le prix avant l'expérience — le désir précède le prix, jamais l'inverse",
    "Oublier de mentionner les avantages réservation directe dans chaque post d'appel à action",
    "Poster les mêmes visuels que Booking.com — le compte Instagram doit montrer CE QUE Booking ne montre pas",
    "Ignorer la saison basse — c'est là que les posts font le plus de différence sur le taux d'occupation",
    "Négliger les Stories pour les disponibilités last-minute du week-end",
    "Captions génériques 'Venez passer un séjour inoubliable' — aucune raison de réserver maintenant",
    "Oublier Google My Business — 60% des recherches hôtel passent par Google Maps",
  ],
  peakSeasons: [
    'février (Saint-Valentin)',
    'avril (Pâques, week-ends printaniers)',
    'juin-août (haute saison)',
    'novembre-décembre (Noël, coffrets cadeaux)',
  ],
  offSeasons: ['janvier (post-fêtes)', 'octobre-novembre (hors événements)'],
}
