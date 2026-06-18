import type { VerticalPlaybook } from './types'

export const restaurant: VerticalPlaybook = {
  vertical: 'restaurant',
  label: 'Restaurant',
  emoji: '🍴',
  dbType: 'restaurant',
  color: 'from-orange-600 to-red-700',
  businessObjectives: [
    'increase_bookings',
    'fill_slow_days',
    'get_google_reviews',
    'promote_event',
    'reduce_platform_dependency',
    'attract_new_customers',
  ],
  contentPillars: [
    'Plat signature sensoriel',
    'Coulisses et geste artisanal',
    'Avis client et preuve sociale',
    'Saisonnalité et produits du marché',
    'Origine produit et producteur local',
    'Équipe et visage humain',
    'Événement et privatisation',
    'CTA réservation urgence',
  ],
  peakDays: ['jeudi', 'vendredi', 'samedi'],
  offDays: ['lundi', 'mardi'],
  bestPostingTimes: ['11:00', '11:30', '17:30', '18:00'],
  conversionChannels: ['website', 'phone', 'google_maps', 'instagram_dm', 'booking_platform'],
  campaignTemplates: [
    {
      id: 'resto-remplir-lundi',
      name: 'Remplir le lundi soir',
      objective: 'fill_slow_days',
      duration: '2 semaines',
      postCount: 6,
      description:
        'Série de posts ciblant le lundi avec offre spéciale ou menu découverte pour générer des couverts sur le créneau le plus creux',
      briefTemplate:
        'Menu découverte [nom] à [prix]€ le lundi soir uniquement. [Nb] plats + [boisson]. Disponible sur réservation. Mettre en avant la qualité sans sacrifier la marge.',
    },
    {
      id: 'resto-avis-google',
      name: 'Campagne avis Google',
      objective: 'get_google_reviews',
      duration: '3 semaines',
      postCount: 4,
      description:
        "Posts qui invitent naturellement à laisser un avis Google après une bonne expérience, sans mendicité",
      briefTemplate:
        'Témoignage client [prénom] : "[citation vraie]". Demander discrètement un avis Google en CTA. Ne jamais dire "laissez-nous un avis" directement.',
    },
    {
      id: 'resto-weekend-reservation',
      name: 'Réservations week-end',
      objective: 'increase_bookings',
      duration: 'En continu',
      postCount: 3,
      description:
        'Posts jeudi-vendredi pour déclencher les réservations du week-end avec urgence réelle',
      briefTemplate:
        'Post [jeudi/vendredi] : [plat ou menu spécial week-end]. [Nb] tables disponibles ce [samedi/dimanche]. CTA réservation directe. Créer urgence réelle.',
    },
    {
      id: 'resto-fork-independance',
      name: 'Réservation directe vs The Fork',
      objective: 'reduce_platform_dependency',
      duration: '1 mois',
      postCount: 8,
      description:
        'Pousser la réservation directe (téléphone ou site) en montrant les avantages : table garantie, demande spéciale, menu sur mesure',
      briefTemplate:
        'Avantage réservation directe chez [nom] : [avantage concret — table fenêtre garantie, bouteille offerte, menu surprise chef]. Réserver au [tel] ou [site].',
    },
  ],
  primaryKpis: [
    'Couverts générés par les posts (traçable par code promo ou question "vu sur Instagram")',
    'Réservations directes vs The Fork / LaFourchette',
    'Taux de remplissage lundi-mardi avant/après campagne',
    "Nombre d'avis Google mensuels",
    'Reach + Saves Instagram (indicateur de désir culinaire)',
  ],
  promptContext: `Tu travailles pour un RESTAURANT. Voici l'expertise terrain pour ce secteur :

TIMING PRÉCIS (résultat de centaines d'A/B tests sur comptes HORECA) :
- 11h00-11h30 : fenêtre décision repas midi → poste plat du jour, menu, suggestion
- 17h30-18h30 : fenêtre décision dîner → poste plat signature, événement soir
- Jeudi 17h : déclenche les réservations week-end → urgence, disponibilités limitées
- Vendredi matin : dernier appel réservation week-end
- Lundi-mardi : éviter CTAs commerciaux → contenu storytelling, coulisses, équipe uniquement

HIÉRARCHIE VISUELLE (du plus performant au moins, pour caption focus) :
1. Close-up texture sensorielle (fondant, croustillant, vapeur) → Instagram saves ×3
2. Geste artisanal chef / main visible → partages ×2, authenticité perçue
3. Mise en scène table avec convives flous → aspiration lifestyle
4. Équipe et coulisses → commentaires ×4, fidélisation locale
5. Menu/ardoise → JAMAIS (illisible mobile, zéro engagement)

PILIERS DANS L'ORDRE DE CONVERSION BUSINESS :
1. Plat signature sensoriel → conversion directe réservation
2. Coulisses chef + équipe → fidélisation et humanisation
3. Avis client (vraie citation) → preuve sociale → convertit les indécis
4. Saisonnalité urgente → "jusqu'à fin [mois]" → scarcité temporelle
5. Événement → réservation groupe, privatisation, anniversaire
6. Origine produit → positionnement qualité, attachement local

CTAs QUI CONVERTISSENT RÉELLEMENT :
- "Réservez votre table → lien en bio" +50% vs "Réservez maintenant"
- "Appelez le [numéro] — il reste X couverts" (scarcité + friction minimale)
- "Dites-nous en DM si vous venez ce soir" (engagement + réservation souple)
- À éviter absolument : "Venez nombreux", "N'hésitez pas", "On vous attend"

ERREURS QUI DÉTRUISENT LA PORTÉE :
- #food #yummy #restaurant (saturés, -40% portée organique)
- Photo plat seule sans contexte = post sans âme, zéro engagement
- "Fait maison" sans preuve → remplacer par nom du producteur ou technique
- Poste promotionnel un lundi ou mardi → paraît désespéré
- CTA flou = couvre à zéro

COPYWRITING SENSORIEL — VERBES ET ADJECTIFS QUI CONVERTISSENT :
- Texture : fondant, croustillant, aérien, nacré, velouté, caramélisé, fumé
- Température : chaud dedans froid dehors, frais du matin, mijoté depuis l'aube
- Origine : pêché ce matin à [port], venu directement de [producteur/lieu]
- Émotion : le plat qui nous a tout appris, la recette de [prénom], l'immanquable

STRATÉGIE HASHTAGS RESTAURANT (par ordre d'efficacité) :
1. Géolocalisés : #restaurant[ville] #gastronomie[ville] #food[ville]
2. Spécialisés : #bistrotfrançais #cuisinefrançaise #bistronomie #terroir
3. Saisonniers : #menuprintemps #ardoisedujour #plaidujour
4. À proscrire : #food #yummy #delicious #instafood (pénalisent la portée)

OBJECTIF BUSINESS PRINCIPAL : transformer chaque post en décision de réservation`,

  commonMistakes: [
    "Publier des photos de plats sans accroche sensorielle — le texte fait la conversion, pas l'image seule",
    "Oublier le CTA réservation dans 80% des posts — chaque post doit avoir une intention",
    'Poster au mauvais moment (dimanche soir, mercredi matin sans intention)',
    'Utiliser #food #yummy #restaurant — hashtags saturés qui pénalisent la portée',
    "Photos d'ardoises ou de menus — illisibles sur mobile, zéro taux d'engagement",
    'Répondre aux avis négatifs sans protocole — amplifie le problème, never fight publicly',
    "Trop de posts promotionnels → fatigue l'audience, lundi-mardi = contenu coulisses uniquement",
    'Oublier Instagram Stories pour les créneaux dispo du soir — Stories = 40% de conversions réservation directe',
  ],
  peakSeasons: [
    'février (Saint-Valentin)',
    'mars-avril (Pâques, terrasse)',
    'mai-juin (fêtes, soleil)',
    'novembre-décembre (réveillons)',
  ],
  offSeasons: ['janvier (post-fêtes)', 'août (si clientèle locale)'],
}
