import type { VerticalPlaybook } from './types'

export const coiffeur: VerticalPlaybook = {
  vertical: 'coiffeur',
  label: 'Coiffeur',
  emoji: '✂️',
  dbType: 'restaurant',
  color: 'from-pink-600 to-rose-700',
  businessObjectives: [
    'fill_slow_days',
    'attract_new_customers',
    'increase_bookings',
    'sell_offer',
    'get_google_reviews',
    'increase_dms',
  ],
  contentPillars: [
    'Avant/après transformation couleur',
    'Coupe tendance avec détail technique',
    'Équipe et portrait styliste',
    'Conseil capillaire expert',
    'Offre première visite',
    'Disponibilités semaine',
    'Produit et routine soin',
    'Inspiration saisonnière',
  ],
  peakDays: ['jeudi', 'vendredi', 'samedi'],
  offDays: ['lundi', 'dimanche'],
  bestPostingTimes: ['08:30', '12:00', '17:00'],
  conversionChannels: ['instagram_dm', 'phone', 'online_booking', 'whatsapp'],
  campaignTemplates: [
    {
      id: 'coiffeur-premiere-visite',
      name: 'Offre découverte première visite',
      objective: 'attract_new_customers',
      duration: '3 semaines',
      postCount: 5,
      description:
        "Attirer de nouveaux clients avec une offre spéciale première visite — réduire la barrière psychologique de changer de coiffeur",
      briefTemplate:
        "Première visite chez [nom salon] : [offre — -20% sur la prestation, soin offert, consultation colorimétrique gratuite]. Pour [type de prestation]. Prenez RDV : [DM/lien/tel]. Valable jusqu'au [date].",
    },
    {
      id: 'coiffeur-tendance-saison',
      name: 'Tendance couleur de la saison',
      objective: 'attract_new_customers',
      duration: '2 semaines',
      postCount: 4,
      description:
        "Positionner le salon comme expert de la tendance couleur du moment — balayage, babylights, couleur saisonnière — contenu éducatif et inspirationnel",
      briefTemplate:
        "Tendance [saison] chez [nom] : [technique — balayage soleil, babylights cuivrées, glossing naturel]. Réalisé par [prénom styliste]. Résultat en [durée séance]. Votre nuance : DM pour consultation gratuite.",
    },
    {
      id: 'coiffeur-creneaux-lundi',
      name: 'Remplir les créneaux lundi-mardi',
      objective: 'fill_slow_days',
      duration: 'En continu',
      postCount: 4,
      description:
        "Poster les créneaux disponibles en début de semaine pour remplir les horaires creux — la disponibilité comme contenu",
      briefTemplate:
        "Créneaux disponibles cette semaine chez [nom] : [liste créneaux — lundi 14h, mardi 10h, etc.]. [Prestation proposée] avec [prénom styliste]. Réservez maintenant : [DM/lien/tel].",
    },
    {
      id: 'coiffeur-avis-google',
      name: 'Campagne avis Google',
      objective: 'get_google_reviews',
      duration: '3 semaines',
      postCount: 4,
      description:
        "Générer des avis Google après une transformation réussie — utiliser le before/after comme déclencheur naturel de témoignage",
      briefTemplate:
        "Transformation [prénom cliente] par [prénom styliste] — [technique]. [Citation client sur l'expérience]. Si vous aussi vous avez aimé votre passage chez [nom], votre avis Google nous aide énormément : [lien Google]. Merci !",
    },
  ],
  primaryKpis: [
    'Nouveaux clients via Instagram (demander à l\'accueil "vu sur Instagram")',
    'Taux de remplissage lundi-mardi avant/après posts créneaux',
    'DMs entrants par semaine (intention de réservation)',
    'Avis Google mensuels (volume + note)',
    'Taux de fidélisation (clients revenus dans les 8 semaines)',
  ],
  promptContext: `Tu travailles pour un SALON DE COIFFURE. Voici l'expertise terrain pour ce secteur :

AVANT/APRÈS — LE ROI DU CONTENU COIFFEUR :
- Le before/after est le contenu #1 : saves ×5, partages ×3, DMs ×4 vs autres posts
- Règle absolue : nommer le styliste et la technique TOUJOURS
  * Mal : "Résultat de notre cliente"
  * Bien : "Transformation [prénom] par [styliste] — balayage soleil + glossing naturel"
- Photographier avant ET après dans la même lumière pour crédibilité
- Le before peut être discret (cheveux attachés, lumière flatteuse) — ne pas humilier la cliente
- La main du styliste visible dans la photo = +40% de confiance perçue

RELATION STYLISTE-CLIENTE — CE QUI DIFFÉRENCIE UN SALON :
- Les clientes ne cherchent pas un coiffeur, elles cherchent "LEUR coiffeur"
- Storytelling styliste : prénom, spécialité, anecdote de formation, passion
  * "J'ai confié mes cheveux à [prénom] depuis 3 ans — ce qu'elle fait avec ma couleur…"
- Portrait styliste mensuel = contenu haute fidélisation et acquisition
- Montrer la consultation AVANT la transformation = expertise, pas juste exécution

VOCABULAIRE TECHNIQUE — INDISPENSABLE POUR LA CRÉDIBILITÉ :
- Couleur : balayage, babylights, mèches, ombre, shatush, glossing, kératine, couleur de fusion
- Coupe : dégradé, effilé, frange rideau, bob asymétrique, shag cut, wolf cut
- Soin : masque kératine, soin botox capillaire, traitement protéique, hydratation profonde
- Toujours utiliser le vocabulaire technique → positionne le salon comme expert vs bas de gamme

CRÉNEAUX DISPONIBLES COMME CONTENU :
- "Il reste [X] créneaux lundi et mardi cette semaine" = contenu qui convertit directement
- Poster lundi matin 8h30 pour remplir la semaine → 30% de taux de prise de RDV
- Nommer le styliste + la prestation disponible → pas générique, personnalisé
- "Annulation de dernière minute — créneau 14h aujourd'hui avec [prénom]" → très efficace

TENDANCES COULEUR SAISONNIÈRES (à mentionner dans les captions) :
- Printemps : babylights naturelles, blond polaire, cuivré doré, glossing transparent
- Été : soleil naturel, balayage beach waves, blond ensoleillé, couleur fusion
- Automne : caramel profond, auburn, brun noisette, copperhead, warm brunette
- Hiver : noir intense, platine, brunette froide, couleur chocolat, gris acier

CTAs COIFFEUR QUI CONVERTISSENT :
- "DM pour réserver avec [prénom]" (personnalisation forte)
- "Appelez le [numéro] — consultations gratuites disponibles [jour]" (zéro risque)
- "Lien de réservation en bio — première visite [offre]" (incentive + facilité)
- À éviter : "Prenez RDV" sans nom de styliste → trop impersonnel

HASHTAGS COIFFEUR (par efficacité) :
1. Géolocalisés : #coiffeur[ville] #salon[ville] #coiffure[ville]
2. Techniques : #balayage #babylights #coloriste #colorhair #haircolor
3. Tendances : #wolfcut #shagcut #frangerideau #bobcut
4. Locaux : #coiffure[région] #styliste[ville]
5. À proscrire : #hair #hairstyle #haircut (trop génériques)

INSTAGRAM STORIES — FORMAT LE PLUS EFFICACE POUR RDV :
- "Créneau libre aujourd'hui [heure] — [styliste] — DM pour réserver" → conversion en 1h
- Sondage "Quelle couleur vous tente ce printemps ?" → engagement + collecte intentions
- "Avant/après de la semaine" → série stories qui dure 3-4 slides

OBJECTIF BUSINESS PRINCIPAL : transformer l'expertise visuelle en flux constant de réservations directes`,

  commonMistakes: [
    "Avant/après sans nommer le styliste — l'anonymat réduit la confiance et la conversion",
    "Oublier les hashtags locaux (#coiffeur[ville]) — 60% des découvertes viennent de la recherche locale",
    "Montrer uniquement le résultat sans la technique — l'expertise se montre, elle ne se dit pas",
    "Ne jamais poster les créneaux disponibles — la disponibilité est un contenu qui convertit directement",
    "Photos en contre-jour ou mal éclairées — investir dans un ring light pour le salon",
    "Captions sans vocabulaire technique — 'belle couleur' vs 'balayage soleil + glossing cuivré'",
    "Ignorer le lundi matin pour les créneaux de la semaine — fenêtre haute intention de réservation",
    "Oublier de mentionner l'offre première visite dans chaque post d'acquisition",
  ],
  peakSeasons: [
    'mars-avril (couleurs printanières, renouveau)',
    'mai-juin (mariages, cérémonies)',
    'septembre (rentrée, nouvelle image)',
    'novembre-décembre (fêtes, réveillons)',
  ],
  offSeasons: ['janvier (budget serré post-fêtes)', 'juillet-août (vacances)'],
}
