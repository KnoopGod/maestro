import type { VerticalPlaybook } from './types'

export const defaultPlaybook: VerticalPlaybook = {
  vertical: 'default',
  label: 'Commerce physique',
  emoji: '🏪',
  dbType: 'restaurant',
  color: 'from-gray-600 to-gray-800',
  businessObjectives: [
    'attract_new_customers',
    'increase_visibility',
    'fill_slow_days',
    'sell_offer',
    'get_google_reviews',
    'increase_dms',
  ],
  contentPillars: [
    'Produit ou service phare',
    'Équipe et humain derrière le commerce',
    'Témoignage et preuve sociale',
    'Nouveauté ou événement',
    'Conseil et expertise',
    'Offre et disponibilité',
    'Histoire et valeurs',
    'Ancrage local',
  ],
  peakDays: ['jeudi', 'vendredi', 'samedi'],
  offDays: ['lundi', 'dimanche'],
  bestPostingTimes: ['09:00', '12:00', '17:00'],
  conversionChannels: ['walk_in', 'instagram_dm', 'phone', 'google_maps', 'website'],
  campaignTemplates: [
    {
      id: 'default-offre-decouverte',
      name: 'Offre découverte — première visite',
      objective: 'attract_new_customers',
      duration: '3 semaines',
      postCount: 5,
      description:
        "Attirer de nouveaux clients avec une offre spéciale première visite — réduire la barrière psychologique d'essayer un nouveau prestataire",
      briefTemplate:
        "Première visite chez [nom] : [offre — réduction, bonus, consultation gratuite]. Pour [description service/produit]. Prenez contact : [DM/lien/tel]. Valable jusqu'au [date].",
    },
    {
      id: 'default-nouveaute',
      name: 'Lancement nouveauté',
      objective: 'increase_visibility',
      duration: '1 semaine',
      postCount: 3,
      description:
        "Créer la curiosité et l'envie autour d'un nouveau produit ou service — transformer un arrivage en événement",
      briefTemplate:
        "Nouveau chez [nom] : [produit/service]. [Ce qui le rend unique — origine, expertise, exclusivité]. Disponible dès [date]. Stock/places limités. Renseignements : [DM/tel/lien].",
    },
    {
      id: 'default-avis-google',
      name: 'Campagne avis Google',
      objective: 'get_google_reviews',
      duration: '3 semaines',
      postCount: 4,
      description:
        "Générer des avis Google après une bonne expérience — améliorer la visibilité locale et la preuve sociale",
      briefTemplate:
        "Merci à [prénom] : \"[citation client]\". Si vous aussi vous avez été satisfait de [nom], votre avis Google nous aide à nous faire connaître localement : [lien Google]. Merci !",
    },
    {
      id: 'default-promotion-saison',
      name: 'Promotion saisonnière',
      objective: 'sell_offer',
      duration: '2 semaines',
      postCount: 6,
      description:
        "Offre promotionnelle liée à une saison ou événement — créer l'urgence temporelle pour convertir les indécis",
      briefTemplate:
        "Offre [saison/événement] chez [nom] : [produit/service] à [prix]€ au lieu de [prix normal]€. Valable [période]. Disponible sur [canal]. Pour en profiter : [CTA direct].",
    },
  ],
  primaryKpis: [
    'Nouvelles visites ou contacts générés par Instagram',
    'Avis Google mensuels (volume + note)',
    'DMs entrants par semaine',
    'Portée locale (followers géographiquement proches)',
    "Taux de remplissage ou d'occupation aux heures creuses",
  ],
  promptContext: `Tu travailles pour un COMMERCE PHYSIQUE LOCAL. Voici les principes fondamentaux du marketing local sur les réseaux sociaux :

RÈGLE D'OR DU COMMERCE LOCAL :
- L'audience locale ne fait pas confiance à ce qu'elle ne connaît pas → le premier objectif est la RECONNAISSANCE
- "Je les ai vus sur Instagram, j'avais l'impression de les connaître déjà" = la conversion la plus facile
- Chaque post doit répondre à : "Pourquoi venir MAINTENANT plutôt que plus tard (ou jamais) ?"

L'HUMAIN EST LE PRODUIT DIFFÉRENCIATEUR :
- Montrer les personnes qui font tourner le commerce → prénom, histoire, passion
- "Ça fait X ans que [prénom] fait [métier]" > n'importe quelle accroche produit
- Portrait équipe régulier → la communauté locale s'attache aux visages, pas aux logos
- La main qui fait, sélectionne, crée → preuve d'authenticité irremplaçable

GOOGLE MAPS — PRIORITÉ ABSOLUE POUR LA DÉCOUVERTE LOCALE :
- 60-70% des découvertes de commerces locaux commencent par une recherche Google ou Maps
- Avis Google = social proof visible avant même la visite du compte Instagram
- Lien Maps dans la bio Instagram + stories périodiques
- Mettre à jour les photos Google My Business mensuellement

TIMING GÉNÉRIQUE COMMERCE LOCAL :
- 9h00 : ouverture de journée, annonce du produit du jour ou conseil matinal
- 12h00 : pause déjeuner, audience qui consulte son téléphone → offre ou conseil court
- 17h00 : fin de journée, décision de passage en boutique après le travail

CTAs QUI FONCTIONNENT POUR UN COMMERCE LOCAL :
- "Passez nous voir ce [jour] — on est là de [heure] à [heure]" (invitation directe, simple)
- "DM pour en savoir plus" (friction minimale)
- "Lien en bio pour réserver / commander" (redirection propre)
- À éviter : "N'hésitez pas à venir", "Venez nombreux" (vague, pas d'action précise)

EXPERTISE — SE DIFFÉRENCIER DES GRANDES SURFACES :
- 1 post conseil par semaine → fidélise l'audience qui revient pour apprendre
- "Les 3 erreurs que tout le monde fait avec [produit/service]" → partages organiques
- Recommandation personnalisée → valeur impossible à reproduire en ligne
- Q&A Stories : "Posez-moi vos questions sur [domaine]" → engagement authentique

SAISONNALITÉ — S'ANCRER DANS LE CALENDRIER LOCAL :
- Fêtes locales, marchés, événements de la ville → présence physique ET digitale
- Collaboration avec commerçants voisins → audience croisée et image solidaire locale
- Décembre (Noël), mai-juin (fêtes, mariages), septembre (rentrée) = pics à préparer

HASHTAGS COMMERCE LOCAL (par efficacité) :
1. Géolocalisés : #[ville] #commercelocal[ville] #[métier][ville]
2. Valeurs : #commercelocal #acheterlocal #artisan #savoirfaire
3. Spécifiques au secteur : adapter selon l'activité
4. À proscrire : hashtags trop génériques sans ancrage géographique

OBJECTIF BUSINESS PRINCIPAL : transformer la présence sur les réseaux en visites physiques régulières et en communauté de clients fidèles attachés à l'humain derrière le commerce`,

  commonMistakes: [
    "Contenu trop générique qui pourrait venir de n'importe quelle marque — manque d'identité locale",
    "Oublier les hashtags géolocalisés — ils sont le principal levier de découverte organique locale",
    "Ne pas répondre aux DMs dans les 2h — le prospect part ailleurs",
    "Poster uniquement des promotions — l'histoire et l'expertise fidélisent mieux que le discount",
    "Négliger Google Maps — la majorité des découvertes locales commencent par Maps, pas Instagram",
    "Photos de mauvaise qualité ou mal cadrées — sur Instagram, la qualité visuelle impacte directement la crédibilité perçue",
    "Ne jamais montrer les personnes de l'équipe — l'humain est le principal différenciateur d'un commerce local",
    "Publier de manière irrégulière — la régularité (minimum 3 posts/semaine) est plus importante que la perfection",
  ],
  peakSeasons: [
    'décembre (fêtes)',
    'mai-juin (fêtes des mères/pères, mariages)',
    'septembre (rentrée)',
    'avril (printemps, Pâques)',
  ],
  offSeasons: ['janvier (budget serré post-fêtes)', 'août (vacances)'],
}
