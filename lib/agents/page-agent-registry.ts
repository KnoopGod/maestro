export interface PageAgentProfile {
  id: string
  name: string
  role: string
  specialty: string
  pageScope: string
}

const PAGE_AGENTS: Array<{ test: (path: string) => boolean; agent: PageAgentProfile }> = [
  {
    test: path => path.startsWith('/studio'),
    agent: {
      id: 'social-director',
      name: 'Social Director',
      role: 'Dirige la création du post',
      specialty: 'Brief, angle marketing, caption, hashtags, CTA, adaptation Facebook/Instagram.',
      pageScope: 'Studio',
    },
  },
  {
    test: path => path.includes('/library') || path === '/library',
    agent: {
      id: 'visual-director',
      name: 'Visual Director',
      role: 'Dirige la DA et les ressources',
      specialty: 'Cohérence visuelle, photos, vidéos, logos, guides de marque et prompts visuels.',
      pageScope: 'Library',
    },
  },
  {
    test: path => path.startsWith('/validation'),
    agent: {
      id: 'impact-reviewer',
      name: 'Impact Reviewer',
      role: 'Contrôle la qualité avant publication',
      specialty: 'Impact commercial, clarté, risques de marque, validation ou correction.',
      pageScope: 'Validation',
    },
  },
  {
    test: path => path.startsWith('/calendar') || path.startsWith('/plan'),
    agent: {
      id: 'publisher',
      name: 'Publisher',
      role: 'Dirige le calendrier de publication',
      specialty: 'Planification, cadence, statuts, posts publiés, posts à venir et cohérence mensuelle.',
      pageScope: 'Calendrier',
    },
  },
  {
    test: path => path.includes('/connections') || path.startsWith('/connections'),
    agent: {
      id: 'publisher-meta',
      name: 'Publisher Meta',
      role: 'Dirige les connexions de publication',
      specialty: 'Facebook, Instagram, tokens Meta, pages, comptes business et diagnostic API.',
      pageScope: 'Connexions',
    },
  },
  {
    test: path => path.includes('/finance') || path.startsWith('/usage'),
    agent: {
      id: 'profit-controller',
      name: 'Profit Controller',
      role: 'Contrôle coûts et rentabilité',
      specialty: 'Coûts API, budgets client, marge, volume de posts/images/vidéos et recommandations ROI.',
      pageScope: 'Rentabilité',
    },
  },
  {
    test: path => path.startsWith('/analytics') || path.includes('/analytics') || path.includes('/report'),
    agent: {
      id: 'performance-analyst',
      name: 'Performance Analyst',
      role: 'Analyse les résultats',
      specialty: 'Insights Meta, reach, engagement, posts gagnants, apprentissages et optimisations.',
      pageScope: 'Analytics',
    },
  },
  {
    test: path => path.startsWith('/clients'),
    agent: {
      id: 'account-director',
      name: 'Account Director',
      role: 'Dirige le compte client',
      specialty: 'Contexte client, objectifs, priorités, tunnel de lancement et orchestration des agents.',
      pageScope: 'Clients',
    },
  },
  {
    test: path => path.startsWith('/agents'),
    agent: {
      id: 'ai-conductor',
      name: 'AI Conductor',
      role: 'Dirige la chaîne des agents',
      specialty: 'Rôles, handoffs, ordre de travail, visibilité des jobs et qualité multi-agents.',
      pageScope: 'Agents',
    },
  },
]

const DEFAULT_AGENT: PageAgentProfile = {
  id: 'ai-conductor',
  name: 'AI Conductor',
  role: 'Dirige la console',
  specialty: 'Orchestration globale, priorisation MVP et navigation dans CODEXRS.',
  pageScope: 'Global',
}

export function resolvePageAgent(path: string): PageAgentProfile {
  return PAGE_AGENTS.find(item => item.test(path))?.agent ?? DEFAULT_AGENT
}
