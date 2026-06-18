import type { VerticalPlaybook } from './types'

export const bar: VerticalPlaybook = {
  vertical: 'bar',
  label: 'Bar',
  emoji: '🍸',
  dbType: 'bar',
  color: 'from-purple-600 to-fuchsia-700',
  businessObjectives: [
    'fill_slow_days',
    'promote_event',
    'attract_new_customers',
    'increase_dms',
    'increase_visibility',
    'sell_offer',
  ],
  contentPillars: [
    'Cocktail signature en action',
    'Behind the bar — bartender',
    'Happy hour et offre semaine',
    'Soirée thématique et événement',
    'Accord cocktail et snack',
    'Ambiance soir et lumière',
    'Nouveau cocktail du mois',
    'Clientèle et bonne humeur',
  ],
  peakDays: ['jeudi', 'vendredi', 'samedi'],
  offDays: ['lundi', 'mardi'],
  bestPostingTimes: ['16:00', '17:30', '20:00'],
  conversionChannels: ['instagram_dm', 'phone', 'walk_in', 'facebook_dm', 'whatsapp'],
  campaignTemplates: [
    {
      id: 'bar-happy-hour-semaine',
      name: 'Happy hour lundi et mardi',
      objective: 'fill_slow_days',
      duration: 'En continu (mensuel)',
      postCount: 8,
      description:
        "Remplir les créneaux lundi-mardi avec un happy hour attractif — poster le jour même à 16h pour déclencher les décisions de sortie",
      briefTemplate:
        "Happy hour [nom] — aujourd'hui [jour] de [heure] à [heure]. [Cocktail signature] à [prix]€ au lieu de [prix normal]€. [Autre offre : bière, vin]. Ambiance [description]. Venez avec [nb max] amis — on vous garde une table : [tel/DM].",
    },
    {
      id: 'bar-soiree-cocktail',
      name: 'Soirée cocktail mensuelle',
      objective: 'promote_event',
      duration: '10 jours avant + rappels',
      postCount: 4,
      description:
        "Soirée thématique mensuelle avec cocktails spéciaux, musique live ou DJ — créer un rendez-vous mensuel qui fidélise",
      briefTemplate:
        "Soirée [thème] chez [nom bar] — [date]. Au programme : [cocktails spéciaux], [musique/DJ/ambiance]. Entrée [gratuite/prix]. [Nb] places. Réservez votre table : [DM/tel/lien].",
    },
    {
      id: 'bar-afterwork',
      name: 'Afterwork partenariat entreprises',
      objective: 'attract_new_customers',
      duration: '2 semaines',
      postCount: 5,
      description:
        "Cibler les professionnels pour les afterworks — offre groupe, privatisation partielle, boissons welcome",
      briefTemplate:
        "Afterwork [jour] chez [nom] — privatisez notre espace pour [nb] personnes. Formule groupe : [description formule]. Réservation groupe : [tel/email]. Idéal pour équipes de [nb] à [nb].",
    },
    {
      id: 'bar-nouveau-cocktail',
      name: 'Lancement cocktail du mois',
      objective: 'increase_visibility',
      duration: '1 semaine',
      postCount: 3,
      description:
        "Créer le buzz autour d'un nouveau cocktail — teaser, révélation, retour client — cycle qui génère de la curiosité et des visites",
      briefTemplate:
        "Nouveau cocktail [nom] chez [bar] — [description sensorielle : notes, texture, couleur]. Créé par [prénom bartender]. Ingrédients : [liste]. Disponible jusqu'au [date]. Dites-nous ce que vous en pensez.",
    },
  ],
  primaryKpis: [
    'Trafic lundi-mardi avant/après happy hour (comptage ou estimation)',
    "Fréquentation soirées événements vs soirs normaux",
    "DMs reçus par semaine (intention de visite)",
    'Reach Stories le soir même (conversion immédiate)',
    'Nouveaux followers locaux (audience qualifiée géographiquement)',
  ],
  promptContext: `Tu travailles pour un BAR. Voici l'expertise terrain pour ce secteur :

TIMING BAR — LE MARKETING DE L'IMPULSION :
- 16h00 : "Qu'est-ce qu'on fait ce soir ?" → post happy hour ou événement du soir
- 17h30 : fenêtre décision afterwork → renforcez avec Story "on vous attend dès 18h"
- 20h00 : dernière impulsion pour ceux qui hésitent encore
- Jeudi : post pour week-end → l'agenda nocturne se planifie jeudi
- Samedi 14h : post qui anticipe l'ambiance du soir → FOMO maximal
- Lundi-mardi : JAMAIS de post commercial → contenu bartender, ingrédients, création

FOMO — LE MOTEUR NUMÉRO 1 DU BAR :
- "Il reste 3 tables ce soir" → conversion immédiate
- "Ce cocktail n'existe que ce mois-ci" → urgence douce
- "Les [X] premières personnes à DM ont leur Happy Hour offert" → gamification
- Montrer les gens qui s'amusent > montrer les cocktails seuls
- La Story qui montre le bar plein à 21h → les retardataires arrivent en 30 min

DESCRIPTION SENSORIELLE COCKTAIL — INDISPENSABLE :
- JAMAIS : "Cocktail au citron et vodka" → mort
- TOUJOURS : [qualificatif sensoriel] + [note aromatique] + [texture] + [moment idéal]
- Exemples qui fonctionnent :
  * "Fumé, floral et terriblement addictif — [nom]"
  * "Bitter en attaque, miel en finale, feu en bouche — [nom]"
  * "Le cocktail qui sent les vacances à [destination]"
  * "Aigre-doux, déstabilisant, impossible à poser"
- Verbes : tournoyer, enrober, surprendre, exploser, fondre, perdre

CONTENU DERRIÈRE LE BAR — CONTENU PREMIUM :
- Bartender par prénom + histoire = audience fidèle
- Geste de préparation en vidéo (smoker, flambé, twist de zeste) → Reels viraux
- Sourcing d'un ingrédient rare = storytelling authentique
- "La recette secrète de [prénom]" → teaser curiosité

ÉVÉNEMENTS — STRATÉGIE EN 3 TEMPS :
1. Annonce J-10 : "On prépare quelque chose" → teaser mystère, image partielle
2. Rappel J-3 : "Plus que [X] places" → urgence scarcité
3. Jour J 15h-16h : "Ce soir, [programme exact], on vous attend" → décision finale
- Ne JAMAIS annoncer une soirée uniquement la veille → trop tard pour planifier

HASHTAGS BAR (par efficacité) :
1. Géolocalisés : #bar[ville] #cocktail[ville] #sortir[ville]
2. Spécialisés : #cocktailbar #mixology #artisanalcocktail #speakeasy
3. Événementiels : #afterwork[ville] #soireécocktail #happyhour
4. À proscrire : #drink #bar #party (aucune valeur locale)

STORY INSTAGRAM BAR — FORMAT HAUTE CONVERSION :
- "Ce soir [heure] — [ambiance] — [place disponible] — swipe up" = 15% de conversion
- Story ambiance "on est là" en soirée = visite des indécis dans l'heure
- Stories Q&A sur le cocktail du moment = engagement + collecte d'intentions

OBJECTIF BUSINESS PRINCIPAL : remplir le bar les jours creux et transformer chaque soirée en événement`,

  commonMistakes: [
    "Poster le lundi pour un événement le mercredi — trop tôt, l'audience oublie",
    "Photos de cocktails sous-exposées ou floues — la lumière du bar est trompeuse, utiliser une lumière additionnelle",
    "Description de cocktail sans mots sensoriels — 'rhum citron menthe' ne fait pas rêver",
    "Oublier la Story le soir même pour convertir les indécis en visite",
    "Événements annoncés trop tard (veille) — les gens ont déjà des plans",
    "Ne jamais montrer les visages et l'ambiance — les clients viennent pour l'expérience humaine",
    "Posts happy hour trop génériques — toujours nommer le cocktail spécifique et le prix",
    "Ignorer les DMs entrants — un DM sans réponse = client perdu définitivement",
  ],
  peakSeasons: [
    'juin (apéros terrasse, fin d\'année scolaire)',
    'juillet-août (tourisme, terrasses)',
    "octobre-novembre (retour afterworks, soirées d'automne)",
    'décembre (fêtes de fin d\'année, afterworks)',
  ],
  offSeasons: ['janvier (torpeur post-fêtes)', 'mars (creux entre hiver et printemps)'],
}
