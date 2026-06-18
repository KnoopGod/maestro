import type { VerticalPlaybook } from './types'

export const salleDesSport: VerticalPlaybook = {
  vertical: 'salle_de_sport',
  label: 'Salle de sport',
  emoji: '💪',
  dbType: 'restaurant',
  color: 'from-red-600 to-orange-700',
  businessObjectives: [
    'sell_membership',
    'attract_new_customers',
    'fill_slow_days',
    'promote_event',
    'increase_visibility',
    'sell_offer',
  ],
  contentPillars: [
    'Transformation membre (avec accord)',
    'Ambiance cours collectif',
    'Coach et expertise',
    'Défi et challenge communauté',
    'Équipements et espace',
    'Conseil nutrition et lifestyle',
    'Offre abonnement et essai',
    'Résultats et témoignages',
  ],
  peakDays: ['lundi', 'mardi', 'mercredi'],
  offDays: ['dimanche', 'samedi après-midi'],
  bestPostingTimes: ['07:00', '12:00', '17:30', '19:00'],
  conversionChannels: ['website', 'walk_in', 'phone', 'instagram_dm', 'google_maps'],
  campaignTemplates: [
    {
      id: 'sport-defi-janvier',
      name: 'Défi Janvier 30 jours',
      objective: 'sell_membership',
      duration: 'Tout le mois de janvier',
      postCount: 12,
      description:
        "Capitaliser sur les bonnes résolutions de janvier — le mois le plus porteur de l'année pour les inscriptions",
      briefTemplate:
        "Défi [nom] janvier chez [salle] : [X] jours pour [objectif concret — perdre X kg, courir 5km, reprendre le sport]. Coaching [prénom] inclus. Inscription : [lien/DM]. Démarrez le [date]. Limité à [nb] places.",
    },
    {
      id: 'sport-essai-gratuit',
      name: 'Offre essai gratuit 7 jours',
      objective: 'attract_new_customers',
      duration: '2 semaines',
      postCount: 5,
      description:
        "Réduire la barrière psychologique à l'inscription avec un essai sans risque — convertit 3x mieux que les offres discount",
      briefTemplate:
        "Venez essayer [nom salle] gratuitement pendant [X] jours. Accès illimité aux cours collectifs, machines, et coaching. Sans engagement. [Nb] places disponibles ce mois. Démarrez : [lien/DM/tel].",
    },
    {
      id: 'sport-rentree-septembre',
      name: 'Rentrée septembre — offre inscription',
      objective: 'sell_membership',
      duration: '3 semaines (fin août-septembre)',
      postCount: 7,
      description:
        "Deuxième pic d'inscriptions de l'année — capitaliser sur la motivation de rentrée avec une offre limitée",
      briefTemplate:
        "Rentrée sportive chez [nom] : inscription [offre — frais d'inscription offerts, -30% sur le premier mois]. Cours collectifs [liste types], machines [équipements clés]. Offre jusqu'au [date]. Inscription : [lien].",
    },
    {
      id: 'sport-parrainage',
      name: 'Parrainage membre — ami',
      objective: 'attract_new_customers',
      duration: '1 mois',
      postCount: 4,
      description:
        "Transformer les membres actuels en ambassadeurs — le bouche-à-oreille amplifié par le social media",
      briefTemplate:
        "Parrainez un ami chez [nom salle] : vous gagnez [récompense parrain — mois offert, réduction]. Votre ami bénéficie de [avantage filleul]. Parrainez via [DM/lien]. Valable jusqu'au [date].",
    },
  ],
  primaryKpis: [
    'Nouvelles inscriptions mensuelles (pic janvier et septembre à surveiller)',
    "Taux de rétention membres à 3 mois (abandons post-janvier = signe contenu trop axé acquisition)",
    'Taux de remplissage cours collectifs',
    "Leads essai gratuit générés par les posts",
    "DMs entrants par semaine (intentions d'inscription)",
  ],
  promptContext: `Tu travailles pour une SALLE DE SPORT. Voici l'expertise terrain pour ce secteur :

SAISONNALITÉ CRITIQUE — LES DEUX MOIS QUI FONT L'ANNÉE :
- JANVIER : pic absolu des inscriptions (bonnes résolutions) → contenu transformationnel, défi, communauté
  * Commencer les posts dès le 26-28 décembre : "Dès le 1er janvier, tu es prêt ?"
  * Objectif janvier : capter MAX d'inscriptions dans les 15 premiers jours
- SEPTEMBRE : deuxième pic (rentrée) → motivation retour sport après vacances
  * Commencer fin août : "Cette rentrée, tu t'y tiens vraiment ?"
  * Ne pas attendre le 1er septembre — les décisions se prennent 2 semaines avant
- JUILLET-AOÛT : période morte → contenu lifestyle, maintien, vacances actives — JAMAIS de promo agressive
- MAI-JUIN : pré-été → "Préparez votre été" (corporal) → contenu motivation + offres

TRANSFORMATION MEMBRE — LE CONTENU QUI DÉCLENCHE LES INSCRIPTIONS :
- Before/after avec accord du membre = contenu le plus puissant (sauvegardes ×6)
- TOUJOURS inclure : prénom du membre, durée du programme, coach suivi
- "En [X] mois avec [coach], [prénom] a [résultat concret et réaliste]"
- Éviter les before/after irréalistes (photos stock) → perte de crédibilité totale
- Les témoignages écrits (screenshot) sans photo convertissent aussi très bien

TIMING HORAIRES — FENÊTRES SPORT :
- 7h00 : avant le travail → "Lance ta journée" → résolution matinale du sportif
- 12h00 : pause déjeuner → "30 min de sport = énergie pour l'après-midi" → décision rapide
- 17h30-19h00 : après le travail → post-workout → cibler la fatigue/motivation du soir

CONTENU COURS COLLECTIFS — LEVIER D'ACQUISITION SOUVENT NÉGLIGÉ :
- Les cours collectifs (yoga, pilates, HIIT, zumba, spinning) attirent une audience différente que la salle seule
- Montrer le PLAISIR collectif > montrer la souffrance → accessibilité perçue
- "Pas besoin de savoir faire — notre [coach] s'occupe de tout" → lève la barrière débutant
- Planning de la semaine en Story chaque lundi = fidélisation + anticipation

OFFRE ESSAI GRATUIT VS DISCOUNT — PSYCHOLOGIE :
- "7 jours gratuits" convertit 3x mieux que "-30% sur l'abonnement"
- Le prospect veut TESTER avant de s'engager → lever le risque perçu > réduire le prix
- "Aucun engagement, aucune CB requise" → conversion maximale
- Après 7 jours d'essai → 65% de conversion en abonnement payant (moyenne secteur)

COMMUNAUTÉ ET APPARTENANCE — CE QUI FIDÉLISE :
- Défis mensuels avec classement → engagement + viralité naturelle
- "Félicitez [prénom] qui a terminé son [Xème] cours cette année" → preuve sociale + émotion
- Stories des cours collectifs le soir → "On est là, c'est votre tour demain"
- Groupe WhatsApp ou Instagram Close Friends pour membres → communauté exclusive

HASHTAGS SALLE DE SPORT (par efficacité) :
1. Géolocalisés : #sport[ville] #fitness[ville] #salle[ville]
2. Spécialisés : #fitness #muscu #coursecollectif #crossfit #yoga #pilates
3. Motivationnels : #transformation #fitness2025 #nouveléan #rentréesportive
4. À proscrire : #gym #fit #workout (saturés, portée nulle)

OBJECTIF BUSINESS PRINCIPAL : convertir les moments de motivation (janvier, rentrée, pré-été) en inscriptions durables via la preuve sociale et l'essai sans risque`,

  commonMistakes: [
    "Before/after avec des photos de stock irréalistes — destruction immédiate de la crédibilité",
    "Contenu uniquement technique et physique sans émotion communautaire — les gens rejoignent une communauté, pas des machines",
    "Négliger janvier et septembre — ces deux mois représentent 50-60% des nouvelles inscriptions annuelles",
    "Proposer un discount plutôt qu'un essai gratuit — psychologiquement moins efficace pour le sport",
    "Oublier les cours collectifs dans le contenu — ils sont le premier vecteur d'acquisition pour les débutants",
    "Posts trop axés performances (charges, km) sans résultats concrets — parler bénéfice, pas technique",
    "Ne jamais poster de témoignage ou transformation — la preuve sociale est le moteur de conversion #1",
    "Ignorer le timing : poster à 22h pour une salle de sport est inutile",
  ],
  peakSeasons: [
    'janvier (résolutions, pic inscriptions absolues)',
    'mai-juin (préparation été)',
    'septembre (rentrée sportive)',
    'novembre (préparation fêtes, remise en forme)',
  ],
  offSeasons: ['juillet-août (vacances, baissse fréquentation)', 'décembre (fêtes, moins de motivation)'],
}
