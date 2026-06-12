/**
 * CODEXRS agent registry — describes every agent in the runtime pipeline,
 * in the order they execute when a post is created and published.
 */
import { AGENT_EXPERTISE_PROFILES } from '@/lib/agents/prompts'

export type AgentStatus = 'active' | 'next' | 'planned'

export interface CODEXRSAgent {
  id: string
  name: string
  role: string
  specialty: string
  order: number
  inputs: string[]
  outputs: string[]
  qualityChecks: string[]
  status: AgentStatus
  model: string
  file?: string
  emoji: string
  color: string
  seniorPersona?: string
  feedbackLoop?: string[]
  failureModes?: string[]
}

export type MaestroAgent = CODEXRSAgent

type AgentRegistryDefinition = Omit<CODEXRSAgent, 'seniorPersona' | 'feedbackLoop' | 'failureModes'>

const AGENT_DEFINITIONS: AgentRegistryDefinition[] = [
  {
    id: 'account-director',
    name: 'Account Director',
    role: 'Chef de dossier client',
    specialty: 'Comprend le client, ses objectifs, sa saisonnalité et ce qu\'il faut prioriser pour la semaine.',
    order: 1,
    inputs: ['profil client', 'stratégie', 'historique posts'],
    outputs: ['priorité', 'objectif business', 'brief enrichi'],
    qualityChecks: ['objectif clair', 'contexte client chargé', 'pas de demande floue'],
    status: 'active',
    model: 'logique métier (lib/db)',
    emoji: '🎯',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'strategy-director',
    name: 'Strategy Director · Planner',
    role: 'Idéation et stratégie de contenu',
    specialty: 'Transforme un client en plan de posts : 5 idées variées rattachées aux piliers de contenu.',
    order: 2,
    inputs: ['client', 'stratégie', 'piliers de contenu'],
    outputs: ['liste d\'idées', 'pilier', 'objectif par idée', 'créneau optimal'],
    qualityChecks: ['cohérent avec la stratégie', 'utile commercialement', 'pas de redite'],
    status: 'active',
    model: 'Claude Opus 4.7 (adaptive thinking)',
    file: 'lib/agents/planner.ts',
    emoji: '🧭',
    color: 'from-blue-600 to-cyan-700',
  },
  {
    id: 'social-expert',
    name: 'Social Expert · Social Director',
    role: 'Captions, hashtags, hook et CTA',
    specialty: 'Écrit les captions Instagram/Facebook avec hook, CTA et hashtags locaux. Lit la DA et adapte.',
    order: 3,
    inputs: ['brief', 'plateformes', 'voix de marque', 'DA'],
    outputs: ['caption', 'hashtags', 'hook', 'CTA'],
    qualityChecks: ['pas générique', 'donne envie', 'adapté plateforme', 'respect brand voice'],
    status: 'active',
    model: 'Claude Opus 4.7 (adaptive thinking)',
    file: 'lib/agents/social-expert.ts',
    emoji: '💬',
    color: 'from-purple-600 to-pink-700',
  },
  {
    id: 'visual-director',
    name: 'Visual Director · Image Generator',
    role: 'Direction artistique image',
    specialty: 'Crée les visuels alignés sur la DA du client. Lit le style_prompt synthétisé.',
    order: 4,
    inputs: ['prompt image', 'DA client', 'brief'],
    outputs: ['image 1024×1024', 'prompt final injecté'],
    qualityChecks: ['respect la DA', 'pas stock photo', 'visuel exploitable'],
    status: 'active',
    model: 'OpenAI gpt-image-1',
    file: 'lib/agents/image-generator.ts',
    emoji: '🎨',
    color: 'from-pink-600 to-fuchsia-700',
  },
  {
    id: 'da-curator',
    name: 'DA Curator · Visual Identity',
    role: 'Synthèse de la Direction Artistique',
    specialty: 'Analyse toutes les ressources d\'un client → palette, mood, style_prompt réinjecté partout.',
    order: 4,
    inputs: ['assets analysés', 'documents DA'],
    outputs: ['palette', 'style_prompt', 'mots-clés style'],
    qualityChecks: ['cohérence multi-assets', 'style exploitable', 'lisible par les autres agents'],
    status: 'active',
    model: 'Claude Opus 4.7 (vision + synthèse)',
    file: 'lib/agents/visual-identity.ts',
    emoji: '✨',
    color: 'from-rose-600 to-pink-700',
  },
  {
    id: 'vision-analyzer',
    name: 'Vision Analyzer',
    role: 'Analyse des ressources visuelles',
    specialty: 'Tag chaque photo : palette dominante, mood, sujets, qualité, description.',
    order: 4,
    inputs: ['image'],
    outputs: ['tags', 'palette', 'mood', 'description IA'],
    qualityChecks: ['détection précise', 'palette fidèle', 'tags exploitables'],
    status: 'active',
    model: 'Claude Vision',
    file: 'lib/agents/vision-analyzer.ts',
    emoji: '👁️',
    color: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'supervisor',
    name: 'Claude Supervisor · Impact Reviewer',
    role: 'Quality gate avant publication',
    specialty: 'Relit chaque post : marque, conversion, clarté, cohérence DA. Verdict ready / revise / blocked.',
    order: 5,
    inputs: ['post complet', 'client', 'stratégie'],
    outputs: ['verdict', 'score impact', 'risques', 'améliorations', 'next action'],
    qualityChecks: ['risques visibles', 'amélioration actionnable', 'pas de blocage abusif'],
    status: 'active',
    model: 'Claude Opus 4.7 (adaptive thinking)',
    file: 'lib/agents/supervisor.ts',
    emoji: '🛡️',
    color: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'publisher',
    name: 'Publisher · Meta',
    role: 'Publication Facebook + Instagram',
    specialty: 'Publie sur Meta après validation. Décore les erreurs API avec la solution actionnable.',
    order: 6,
    inputs: ['post validé', 'page token', 'image publique'],
    outputs: ['post_id Facebook', 'post_id Instagram', 'status'],
    qualityChecks: ['token actif', 'image accessible', 'erreur traçable'],
    status: 'active',
    model: 'Meta Graph API v23.0',
    file: 'lib/agents/meta-publisher.ts',
    emoji: '📤',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'performance-analyst',
    name: 'Performance Analyst',
    role: 'Apprentissage post-publication',
    specialty: 'Analyse likes, commentaires, reach, clics → recommandations pour les prochains posts.',
    order: 7,
    inputs: ['likes', 'commentaires', 'reach', 'clics'],
    outputs: ['insights', 'patterns', 'recommandations'],
    qualityChecks: ['comparaison historique', 'insight actionnable', 'pas de vanity metric seule'],
    status: 'next',
    model: 'Claude Opus 4.7 (planifié)',
    emoji: '📊',
    color: 'from-violet-600 to-purple-800',
  },
  {
    id: 'profit-controller',
    name: 'Profit Controller',
    role: 'Contrôle marge, budget et rendement',
    specialty: 'Agent de contrôle post-campagne/mensuel : vérifie marge, budget et coût des livrables avant d’engager vidéo, ads ou génération coûteuse.',
    order: 8,
    inputs: ['abonnement client', 'coûts posts réels', 'coûts médias estimés', 'budgets ads', 'temps interne'],
    outputs: ['statut marge', 'alertes blocage/warning', 'coût/post', 'recommandations ROI'],
    qualityChecks: ['marge cible respectée', 'données réelles vs estimées visibles', 'dépenses coûteuses justifiées', 'optimisation proposée'],
    status: 'active',
    model: 'règles métier + données usage',
    file: 'lib/agents/profit-controller.ts',
    emoji: '💶',
    color: 'from-emerald-600 to-lime-700',
  },
  {
    id: 'video-creator',
    name: 'Video Creator',
    role: 'Image → reel court',
    specialty: 'Transforme un visuel validé en reel 5-10 s pour Instagram et TikTok via Luma Dream Machine.',
    order: 9,
    inputs: ['image validée', 'caption', 'brief'],
    outputs: ['vidéo MP4 9:16', 'asset bibliothèque'],
    qualityChecks: ['mouvement naturel', 'pas de glitch', 'durée plateforme'],
    status: 'active',
    model: 'Luma Dream Machine (image-to-video)',
    file: 'lib/agents/video-creator.ts',
    emoji: '🎬',
    color: 'from-orange-600 to-red-700',
  },
]

export const AGENTS: CODEXRSAgent[] = AGENT_DEFINITIONS.map(agent => {
  const profile = AGENT_EXPERTISE_PROFILES[agent.id]
  if (!profile) return agent

  return {
    ...agent,
    seniorPersona: profile.seniorPersona,
    feedbackLoop: profile.feedbackLoop,
    failureModes: profile.commonFailureModes,
  }
})
