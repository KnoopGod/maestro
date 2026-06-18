import type { VerticalPlaybook } from './types'

export const bnb: VerticalPlaybook = {
  vertical: 'bnb',
  label: "Chambre d'hôte",
  emoji: '🏡',
  dbType: 'bnb',
  color: 'from-emerald-600 to-green-800',
  businessObjectives: [
    'increase_bookings',
    'reduce_platform_dependency',
    'attract_new_customers',
    'fill_slow_days',
    'get_google_reviews',
    'increase_dms',
  ],
  contentPillars: [
    'Cadre naturel et vue imprenable',
    'Petit-déjeuner fait maison et authenticité',
    'Activités et découvertes locales',
    'Chambre mise en scène avec âme',
    'Témoignage chaleureux client',
    'Disponibilités et invitation directe',
    'Hôte et histoire personnelle',
    'Saison et ambiance du moment',
  ],
  peakDays: ['mardi', 'mercredi', 'jeudi'],
  offDays: ['lundi'],
  bestPostingTimes: ['08:00', '12:30', '18:30'],
  conversionChannels: ['website', 'instagram_dm', 'whatsapp', 'email', 'booking_platform', 'phone'],
  campaignTemplates: [
    {
      id: 'bnb-weekend-romantique',
      name: 'Week-end romantique en dernière minute',
      objective: 'fill_slow_days',
      duration: '1 semaine',
      postCount: 3,
      description:
        "Story + post jeudi soir pour remplir le week-end — créer l'envie de s'évader en couple avec disponibilités réelles et cadre romantique",
      briefTemplate:
        "Ce week-end, il reste [nb] chambres à [nom B&B]. [Cadre — forêt, campagne, bord de rivière]. Petit-déjeuner [spécialité maison] inclus. [Prix]€/nuit. Réservez par DM ou [lien]. Disponible [dates exactes].",
    },
    {
      id: 'bnb-saison-lente',
      name: "Offre séjour semaine — basse saison",
      objective: 'increase_bookings',
      duration: '3 semaines',
      postCount: 5,
      description:
        "Créer un désir de slow life en semaine pour les télétravailleurs et retraités — public disponible hors week-end",
      briefTemplate:
        "Séjour semaine [mois] chez [nom] : [nb] nuits à [prix]€/nuit. WiFi haut débit, bureau, calme total. Petit-déjeuner [spécialité]. Idéal télétravail ou retraite ressourçante. Réservez : [lien/DM/tel].",
    },
    {
      id: 'bnb-coffret-noel',
      name: 'Coffret cadeau Noël séjour',
      objective: 'increase_revenue_period',
      duration: '4 semaines (novembre-décembre)',
      postCount: 4,
      description:
        "Vendre des séjours en coffret cadeau pour les fêtes — produit clé pour acquérir de nouveaux clients via l'entourage des habitués",
      briefTemplate:
        "Offrez [X nuits] chez [nom] pour Noël. Coffret [formule : chambre + petit-déjeuner + [extra]] à [prix]€. Valable jusqu'au [date]. Commandez par [DM/email/lien]. Livraison numérique ou physique possible.",
    },
    {
      id: 'bnb-reservation-directe',
      name: 'Réservation directe vs Airbnb',
      objective: 'reduce_platform_dependency',
      duration: '1 mois',
      postCount: 6,
      description:
        "Éduquer l'audience sur les avantages de réserver directement : meilleur tarif, contact personnalisé, flexibilité",
      briefTemplate:
        "Réserver directement chez [nom] = [avantage concret : -10% sur le tarif, check-in flexible, panier de bienvenue, demandes spéciales acceptées]. Sans commission Airbnb. Contact : [email/tel/lien direct].",
    },
  ],
  primaryKpis: [
    'Réservations directes vs Airbnb / Booking.com (objectif : 50% direct en 6 mois)',
    "Taux d'occupation basse saison (lundi-jeudi)",
    'Avis Google et Airbnb (note + volume mensuel)',
    'DMs reçus par semaine (indicateur de désir)',
    'Taux de retour clients (fidélisation via liste email)',
  ],
  promptContext: `Tu travailles pour une CHAMBRE D'HÔTE (B&B). Voici l'expertise terrain pour ce secteur :

PSYCHOLOGIE DE L'ACHETEUR B&B — 80% ÉMOTIONNEL, 20% RATIONNEL :
- Le client B&B ne cherche PAS un lit : il cherche une expérience, une évasion, un souvenir
- Il veut se sentir INVITÉ chez quelqu'un, pas dans un hôtel anonyme
- La décision se prend sur le coup de cœur, pas sur le prix
- Règle d'or : créer le rêve d'abord, parler réservation ensuite
- Le prix ne vient JAMAIS en premier dans une caption B&B

L'HÔTE EST LE PRODUIT — CE QUI DIFFÉRENCIE LE B&B :
- Le prénom de l'hôte, son histoire, sa passion SONT le contenu
- "Marie vous accueille depuis 8 ans dans sa ferme du Luberon" convertit mieux que "chambre vue jardin"
- Montrer la personnalité : humour, passion culinaire, expertise randonnée, connaissance locale
- La photo de l'hôte en train de préparer le petit-déjeuner = contenu émotionnel fort
- Le "fait maison" doit être prouvé : recette de la confiture, nom du producteur de miel, jardin visible

PETIT-DÉJEUNER — LE LEVIER NUMÉRO 1 DU B&B :
- 70% des avis B&B mentionnent le petit-déjeuner en premier
- Post dédié petit-déjeuner → 2x plus de saves qu'une chambre
- Détails qui convertissent : confitures maison, pain de la boulangerie d'à côté, oeufs du poulailler, jus frais
- Timing idéal : 8h00 — "Ce matin chez nous" → projection immédiate du lecteur

CADRE NATUREL — HIÉRARCHIE VISUELLE (du plus performant au moins) :
1. Vue depuis la terrasse / fenêtre avec lumière dorée (matin ou soir)
2. Petit-déjeuner en extérieur ou sur plateau avec vue
3. Chambre avec lumière naturelle + détail cosy (livre, bougie, fleurs)
4. Activité locale mise en avant (randonnée, marché, baignade)
5. Portrait hôte en action (cuisine, jardin, accueil)

CTAs QUI FONCTIONNENT POUR UN B&B :
- "DM pour connaître nos disponibilités" (friction ultra-faible + contact humain)
- "Il reste [X] nuits libres ce [mois] — écrivez-nous" (scarcité + invitation)
- "Lien de réservation directe en bio — sans frais Airbnb" (éducation + avantage)
- À éviter : "Réservez maintenant" (trop commercial, casse l'ambiance B&B)

CONTENU SAISONNIER — CE QUI CONVERTIT PAR PÉRIODE :
- Printemps : jardin en fleurs, randonnées, marchés fermiers, terrasse ensoleillée
- Été : baignade, soirées dehors, lumière chaude, terroir local
- Automne : couleurs, champignons, feu de cheminée, slow life
- Hiver : couvertures plaid, thé chaud, neige (si applicable), Noël en famille

INSTAGRAM DM — CANAL NUMÉRO 1 DE CONVERSION B&B :
- 40-60% des réservations directes passent par DM chez les B&B actifs sur Instagram
- Répondre en moins de 2h est ESSENTIEL (le voyageur compare 3-4 B&B simultanément)
- Réponse personnalisée > réponse automatique pour ce secteur
- Stories "disponibilités this weekend" → DMs immédiats → réservation en 30 min

OBJECTIF BUSINESS PRINCIPAL : réduire la dépendance Airbnb et construire une base de clients directs fidèles`,

  commonMistakes: [
    "Commencer la caption par le prix — tuer le rêve avant de le créer",
    "Photos de chambre vide sans âme — le B&B, c'est l'ambiance, pas le mobilier",
    "Oublier de montrer l'hôte — l'humain est le produit différenciateur",
    "Ne pas répondre aux DMs dans les 2h — le client part chez un concurrent",
    "Contenu trop formel et commercial — le B&B exige authenticité et chaleur",
    "Ignorer les Stories pour les disponibilités last-minute du week-end",
    "Hashtags génériques (#travel #vacation) au lieu des hashtags géolocalisés",
    "Ne jamais mentionner le petit-déjeuner — c'est pourtant le premier argument de vente",
  ],
  peakSeasons: [
    'mai-juin (week-ends printaniers, randonnées)',
    'juillet-août (haute saison, réservations 4-6 semaines à l\'avance)',
    'octobre (couleurs d\'automne, slow life)',
    'décembre (Noël en famille, coffrets cadeaux)',
  ],
  offSeasons: ['janvier-février (hors Saint-Valentin)', 'novembre (creux)'],
}
