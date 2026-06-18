import type { VerticalPlaybook } from './types'

export const padel: VerticalPlaybook = {
  vertical: 'padel',
  label: 'Club de padel',
  emoji: '🎾',
  dbType: 'restaurant',
  color: 'from-cyan-600 to-blue-700',
  businessObjectives: [
    'fill_slow_days',
    'sell_membership',
    'attract_new_customers',
    'promote_event',
    'sell_offer',
    'increase_bookings',
  ],
  contentPillars: [
    'Créneaux disponibles ce soir/semaine',
    'Tournoi mensuel et compétition',
    'Cours débutants et initiation',
    'Ambiance afterwork et groupe',
    'Abonnement et offre régulière',
    'Offre entreprise et team building',
    'Highlight victoire et moment fun',
    'Conseil technique et progression',
  ],
  peakDays: ['mercredi', 'jeudi', 'vendredi'],
  offDays: ['lundi', 'dimanche matin'],
  bestPostingTimes: ['08:00', '12:00', '17:00', '18:30'],
  conversionChannels: ['online_booking', 'instagram_dm', 'whatsapp', 'website'],
  campaignTemplates: [
    {
      id: 'padel-tournoi-mensuel',
      name: 'Tournoi mensuel open',
      objective: 'promote_event',
      duration: '10 jours avant',
      postCount: 5,
      description:
        "Tournoi mensuel ouvert à tous les niveaux — créer un rendez-vous communautaire régulier qui fidélise et attire",
      briefTemplate:
        "Tournoi [nom/édition] — [date]. Open à partir du niveau [X]. Formule [doubles/simples]. [Nb] terrains, [nb] participants max. Inscription : [lien/DM]. Frais : [prix]. Trophée + [récompense] pour les finalistes.",
    },
    {
      id: 'padel-afterwork',
      name: 'Afterwork padel jeudi soir',
      objective: 'fill_slow_days',
      duration: 'En continu',
      postCount: 6,
      description:
        "Remplir les terrains jeudi soir avec un format afterwork convivial — cibler les professionnels qui veulent décompresser",
      briefTemplate:
        "Afterwork padel ce jeudi [heure]. Terrains disponibles de [heure] à [heure]. Formule [nb] joueurs à [prix total ou par personne]. Réservez : [lien/DM]. Venez à [nb] — on s'occupe de vous faire les équipes.",
    },
    {
      id: 'padel-initiation-debutants',
      name: 'Initiation débutants — session découverte',
      objective: 'attract_new_customers',
      duration: '2 semaines (par session)',
      postCount: 4,
      description:
        "Attirer les personnes qui n'ont jamais joué — le padel est le sport le plus accessible à enseigner, le montrer clairement",
      briefTemplate:
        "Vous n'avez jamais joué au padel ? C'est le moment. Session initiation le [date] à [heure]. Coach [prénom], [nb] joueurs max. [Durée] + [inclus — raquettes, balles, cours]. Prix : [prix]. Réservez : [lien/DM].",
    },
    {
      id: 'padel-team-building',
      name: 'Forfait entreprise team building',
      objective: 'sell_offer',
      duration: '1 mois',
      postCount: 4,
      description:
        "Cibler les entreprises pour des sessions team building — panier moyen 5x supérieur à la réservation individuelle",
      briefTemplate:
        "Team building padel pour votre entreprise chez [nom club]. Formule [nb] joueurs : [terrains] + [durée] + [coaching/arbitrage] + [restauration option]. De [prix min] à [prix max]. Contact : [email/tel]. Devis sous 24h.",
    },
  ],
  primaryKpis: [
    'Taux de remplissage terrains lundi-mercredi (créneaux creux)',
    'Inscriptions tournois mensuels (indicateur communauté)',
    'Nouvelles inscriptions abonnement mensuel',
    'Réservations issues directement des posts "créneaux disponibles"',
    'Leads entreprises (team building) générés par les posts dédiés',
  ],
  promptContext: `Tu travailles pour un CLUB DE PADEL. Voici l'expertise terrain pour ce secteur :

CROISSANCE PADEL EN FRANCE — CONTEXTE MARCHÉ (2023-2025) :
- Le padel est le sport à la croissance la plus rapide en France
- 400 000 pratiquants réguliers → 1,5 million estimés en 2026
- 70% des pratiquants ont commencé depuis moins de 3 ans → marché DÉBUTANTS énorme
- Profil dominant : 30-45 ans, CSP+, urbain, réseau social fort → parfait pour Instagram

DISPONIBILITÉS COMME CONTENU — LA STRATÉGIE #1 :
- "Ce soir 19h30, il reste 1 terrain libre — DM pour réserver" = post qui convertit en 10 min
- Fonctionnement : la scarcité temporelle déclenche l'action immédiate
- Ne pas attendre que les terrains se remplissent → poster activement les créneaux
- Format optimal : heure précise + nb de terrains restants + CTA DM ou lien direct
- Stories "disponibilités du soir" à 17h → conversion dans l'heure → 35% de taux de réservation
- Poster systématiquement les créneaux du dimanche matin le samedi soir

DÉBUTANTS — L'AUDIENCE LA PLUS RENTABLE À LONG TERME :
- 1 débutant converti = abonné potentiel 2-3 ans
- Le frein n°1 : "Je ne sais pas jouer, je vais me ridiculiser"
- Lever ce frein dans CHAQUE post ciblant les débutants :
  * "Le padel s'apprend en 30 minutes — vraiment"
  * "Nos coaches expliquent les règles sur le court, pendant qu'on joue"
  * Montrer des débutants qui rigolent et se rendent compte que c'est facile
- Session initiation : format 2h avec coach = meilleur ROI acquisition

TOURNOI MENSUEL — MOTEUR DE COMMUNAUTÉ ET RÉTENTION :
- Un tournoi mensuel crée un RENDEZ-VOUS communautaire → rétention forte
- Stratégie annonce en 3 temps (voir BAR mais adapté padel) :
  * J-10 : "Inscriptions ouvertes pour le tournoi de [mois]"
  * J-3 : "Il reste [X] places — tableau presque complet"
  * Jour J 14h : "Le tournoi commence dans 3h — le programme"
- Post-tournoi : résultats, podium, photos → contenu facile qui performe bien
- Série de tournois avec classement annuel → fidélisation maximale

AFTERWORK PADEL — SEGMENT B2B SOUS-EXPLOITÉ :
- Jeudi et vendredi soir : forte demande afterwork de groupes 4-8 joueurs
- Communication à cibler : "L'alternative à l'afterwork bar — plus fun, plus actif"
- Poster le mercredi midi pour les réservations jeudi-vendredi
- DM pour organiser = fort taux de conversion car contexte groupe (responsable qui prend décision)

TEAM BUILDING ENTREPRISES — PRODUIT HAUTE VALEUR :
- 1 team building entreprise = 8-20 personnes × 2-4h × tarif groupe = CA journée entier
- LinkedIn est le canal principal pour les DRH et managers (à connecter avec Instagram)
- Instagram : montrer des équipes souriantes, ambiance détendue, moments fun
- Ne jamais parler technique dans le contenu B2B — parler cohésion, énergie, partage

HASHTAGS PADEL (par efficacité) :
1. Géolocalisés : #padel[ville] #padelclub[ville] #padelFrance
2. Sport : #padel #padellife #padeladdict #padellovers
3. Événements : #tournoipadel #padeldebutant #afterworkpadel
4. À proscrire : #sport #tennis (hors sujet ou concurrence directe)

TIMING PRÉCIS PADEL :
- 8h00 : sportifs matinaux → créneaux disponibles de la journée
- 12h00 : pause déjeuner → "Ce soir, qui joue ?" → DMs en groupe WhatsApp
- 17h00 : fin de journée → afterwork décision → créneaux soir disponibles
- 18h30 : dernière chance soir → "Il reste 1 terrain 20h30 — DM maintenant"

OBJECTIF BUSINESS PRINCIPAL : maximiser le remplissage des terrains aux heures creuses via les disponibilités en temps réel et les tournois communautaires`,

  commonMistakes: [
    "Ne pas poster les créneaux disponibles — c'est LE contenu qui convertit le plus directement",
    "Trop de contenu technique (règles, techniques) sans l'aspect fun et social — le padel se vend par l'ambiance",
    "Oublier le marché entreprises (team building) — panier moyen ×5 vs réservation individuelle",
    "Stories insuffisantes pour les créneaux last-minute du soir — le taux de conversion Stories > posts pour la réservation immédiate",
    "Ne cibler que les joueurs confirmés — les débutants représentent 70% du marché à conquérir",
    "Annoncer un tournoi trop tard (veille) — les joueurs ont besoin de 7-10 jours pour s'organiser",
    "Oublier de poster les résultats des tournois — contenu facile, fort engagement communautaire",
    "Captions sans l'aspect social et convivial — le padel n'est pas un sport solitaire, montrer les groupes",
  ],
  peakSeasons: [
    'mars-juin (beau temps, motivation printanière)',
    'septembre-octobre (rentrée sportive)',
    'novembre (indoor, mauvais temps pousse les salles couvertes)',
  ],
  offSeasons: ['juillet-août (vacances, terrains souvent vides)', 'janvier (moins porteur que pour une salle de sport générale)'],
}
