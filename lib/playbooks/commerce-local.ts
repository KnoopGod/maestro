import type { VerticalPlaybook } from './types'

export const commerceLocal: VerticalPlaybook = {
  vertical: 'commerce_local',
  label: 'Commerce local',
  emoji: '🏪',
  dbType: 'restaurant',
  color: 'from-amber-600 to-yellow-700',
  businessObjectives: [
    'attract_new_customers',
    'increase_visibility',
    'sell_offer',
    'get_google_reviews',
    'increase_dms',
    'promote_event',
  ],
  contentPillars: [
    'Produit phare mis en valeur',
    'Coulisses et savoir-faire artisanal',
    'Client fidèle et témoignage',
    'Nouveauté et arrivage',
    "Conseil d'utilisation et expertise",
    'Événement local et participation',
    'Offre et promotion ciblée',
    'Histoire du commerce et équipe',
  ],
  peakDays: ['jeudi', 'vendredi', 'samedi'],
  offDays: ['lundi', 'dimanche'],
  bestPostingTimes: ['09:00', '12:00', '16:00'],
  conversionChannels: ['walk_in', 'instagram_dm', 'phone', 'google_maps', 'website'],
  campaignTemplates: [
    {
      id: 'commerce-arrivage',
      name: 'Arrivage et nouveauté',
      objective: 'attract_new_customers',
      duration: '1 semaine par arrivage',
      postCount: 3,
      description:
        "Transformer chaque arrivage en événement — créer l'urgence et la curiosité autour du nouveau produit ou de la nouvelle collection",
      briefTemplate:
        "Arrivage [catégorie produit] chez [nom] : [produit spécifique]. [Ce qui le rend unique — origine, fabricant, qualité, exclusivité]. Disponible dès [date/maintenant]. Stock limité. Venez en boutique ou DM pour réserver.",
    },
    {
      id: 'commerce-black-friday-local',
      name: 'Black Friday local solidaire',
      objective: 'sell_offer',
      duration: '1 semaine (fin novembre)',
      postCount: 6,
      description:
        "Positionner le commerce comme alternative locale et éthique au Black Friday des géants — engager la communauté locale",
      briefTemplate:
        "Notre Black Friday à nous : [offre — réduction, lot, cadeau]. Achetez local chez [nom] plutôt que sur Amazon. [Produit phare à [prix] vs [prix normal]]. En boutique uniquement. Du [date] au [date].",
    },
    {
      id: 'commerce-carte-cadeau',
      name: 'Carte cadeau fêtes de fin d\'année',
      objective: 'increase_revenue_period',
      duration: '4 semaines (novembre-décembre)',
      postCount: 5,
      description:
        "Vendre des cartes cadeaux pour les fêtes — produit à forte marge, acquisition de nouveaux clients via l'entourage",
      briefTemplate:
        "Carte cadeau [nom commerce] pour Noël — de [montant min]€ à [montant max]€. Idéale pour [occasion/destinataire]. Disponible en boutique ou commande par [DM/email/tel]. Valable [durée]. Offrez du local.",
    },
    {
      id: 'commerce-atelier-evenement',
      name: 'Atelier et événement en boutique',
      objective: 'promote_event',
      duration: '10 jours avant',
      postCount: 4,
      description:
        "Organiser un atelier ou événement en boutique pour attirer de nouveaux clients et renforcer la communauté locale",
      briefTemplate:
        "Atelier [thème] chez [nom] — le [date] à [heure]. [Description courte : ce qu'on fait, ce qu'on apprend]. Animé par [prénom]. [Nb] places. [Gratuit / Prix : X€]. Inscription : [DM/tel/lien].",
    },
  ],
  primaryKpis: [
    "Visites en boutique issues d'Instagram (demander à l'accueil \"vu sur Instagram\")",
    'Avis Google mensuels (volume + note)',
    'DMs entrants par semaine (intentions d\'achat)',
    'Portée locale (followers dans un rayon de [X] km)',
    'Taux de retour clients (fidélisation)',
  ],
  promptContext: `Tu travailles pour un COMMERCE LOCAL (boutique, artisan, épicerie fine, fleuriste, boulangerie, librairie…). Voici l'expertise terrain pour ce secteur :

POSITIONNEMENT ANTI-AMAZON — LA BATAILLE IDENTITAIRE DU COMMERCE LOCAL :
- Le commerce local ne peut pas gagner sur le prix → il gagne sur L'HISTOIRE, l'HUMAIN, et l'EXPERTISE
- "Vu sur Instagram, je suis venu exprès" = la métrique de succès #1 du commerce local sur les réseaux
- Chaque post doit répondre à : "Pourquoi venir CHEZ VOUS plutôt que commander en ligne ?"
- Réponses qui fonctionnent : conseil personnalisé, toucher le produit, histoire de l'artisan, exclusivité locale
- Ne JAMAIS comparer les prix avec les géants → repositionner sur des valeurs incomparables

L'HUMAIN AU CENTRE — CE QUI DIFFÉRENCIE :
- Le propriétaire, l'artisan, le vendeur passionné SONT le contenu
- "Ça fait 12 ans que [prénom] sélectionne ses thés directement au Japon" > "Venez acheter nos thés"
- Montrer les mains qui font, qui sélectionnent, qui emballent avec soin
- Portrait régulier de l'équipe → la communauté locale s'attache aux visages

GOOGLE MAPS — LE CANAL DE DÉCOUVERTE #1 POUR UN COMMERCE LOCAL :
- 65% des nouvelles visites dans un commerce local commencent par une recherche Google Maps
- Les avis Google sont la priorité absolue → noter 4,5+ en permanence
- Lien Google Maps dans chaque bio Instagram ET dans les stories périodiquement
- "Retrouvez-nous sur Google Maps" en CTA régulier → 2x plus de visites sur la fiche
- Photos Google My Business à mettre à jour mensuellement (produits, équipe, boutique)

ARRIVAGES ET NOUVEAUTÉS — CONTENU À HAUTE FRÉQUENCE :
- Chaque arrivage = événement → "Il vient d'arriver et déjà 3 réservés"
- Créer l'urgence réelle : stock limité, exclusivité locale, saison courte
- Unboxing en Story → engagement fort et sentiment de découverte partagée
- "On a tout juste reçu [X] — passez ou DM pour réserver le vôtre"

EXPERTISE — SE POSITIONNER COMME LA RÉFÉRENCE LOCALE :
- 1 post conseil expert par semaine → audience qui revient pour apprendre, pas seulement pour acheter
- "Comment choisir [produit] — les 3 critères que personne ne vous dit" → partages organiques
- Conseil d'utilisation ou entretien → valeur ajoutée immatérielle impossible à commander sur Amazon
- Q&A en Story : "Posez vos questions sur [domaine]" → engagement + collecte des besoins

CONTENU SAISONNIER — ANCRAGE DANS LA VIE LOCALE :
- Marchés de Noël, fêtes locales, vendanges, rentrée → s'inscrire dans le calendrier de la ville
- "Nous participons au [marché/fête locale] ce week-end — venez nous voir"
- Collaboration avec d'autres commerces locaux → audience croisée et image solidaire

HASHTAGS COMMERCE LOCAL (par efficacité) :
1. Géolocalisés : #[ville] #commercelocal[ville] #boutiquelocale #artisan[ville]
2. Valeur : #commercelocal #acheterlocal #faitmaison #artisanat #locavore
3. Spécifiques : #[type de commerce][ville] (ex: #fleuriste[ville], #boulangerie[ville])
4. À proscrire : hashtags de marques concurrentes, hashtags sans lien géographique

INSTAGRAM DM — CONVERSION ULTRA-RAPIDE POUR LE COMMERCE LOCAL :
- Répondre aux DMs dans les 2h → taux de conversion s'effondre au-delà
- "DM pour réserver avant que ça disparaisse" → décision d'achat immédiate
- Partage de photos de produits en exclusivité en DM pour abonnés proches → sentiment VIP
- Auto-réponse pour indiquer les horaires d'ouverture si absent → éviter la frustration

OBJECTIF BUSINESS PRINCIPAL : devenir LA référence locale dans sa catégorie et générer des visites physiques directement depuis Instagram et Google Maps`,

  commonMistakes: [
    "Photos catalogue sans contexte ni histoire — un produit photographié comme sur Amazon ne génère pas de curiosité",
    "Oublier les hashtags géolocalisés — ils sont essentiels pour toucher une audience à portée de marche",
    "Ne pas répondre aux DMs dans les 2h — le client achète ailleurs dans l'heure",
    "Poster uniquement des promotions — l'expertise et l'histoire valent bien plus que le discount",
    "Négliger Google Maps — la majorité des découvertes locales commencent par une recherche Maps",
    "Captions génériques sans expertise — 'beau produit de qualité' vs 'sélectionné par [prénom] lors de son voyage à [lieu]'",
    "Ignorer les événements locaux (marchés, fêtes) — ils génèrent de la visibilité physique ET digitale",
    "Ne jamais montrer l'intérieur de la boutique — les gens veulent savoir dans quel univers ils vont mettre les pieds",
  ],
  peakSeasons: [
    'décembre (fêtes, cartes cadeaux, achats de Noël)',
    'mai-juin (fêtes des mères/pères, mariages, communions)',
    'septembre (rentrée, nouvelles collections)',
    'avril (Pâques, printemps)',
  ],
  offSeasons: ['janvier (budget serré post-fêtes)', 'juillet-août (vacances)'],
}
