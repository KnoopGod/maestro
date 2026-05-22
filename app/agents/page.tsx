import { Bot, Sparkles, Eye, Image as ImageIcon, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

const AGENTS = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    role: 'Génération de captions, hashtags, stratégie',
    model: 'Claude Sonnet 4.6',
    status: 'active',
    icon: MessageSquare,
    color: 'from-purple-600 to-pink-700',
    badge: 'ACTIF',
    capabilities: ['Captions optimisées par plateforme', 'Hashtags ciblés', 'Adaptation brand voice', 'Reasoning stratégique'],
  },
  {
    id: 'vision-analyzer',
    name: 'Vision Analyzer',
    role: 'Analyse images uploadées · extraction palette/mood',
    model: 'Claude Vision',
    status: 'active',
    icon: Eye,
    color: 'from-blue-600 to-cyan-700',
    badge: 'ACTIF',
    capabilities: ['Détection palette couleurs', 'Identification du mood', 'Tagging automatique', 'Description IA'],
  },
  {
    id: 'da-curator',
    name: 'DA Curator',
    role: 'Synthèse Direction Artistique du client',
    model: 'Claude Sonnet 4.6',
    status: 'active',
    icon: Sparkles,
    color: 'from-pink-600 to-fuchsia-700',
    badge: 'ACTIF',
    capabilities: ['Synthèse multi-assets', 'Style prompt généré', 'Cohérence visuelle', 'Mots-clés style'],
  },
  {
    id: 'photo-enhancer',
    name: 'Photo Enhancer',
    role: 'Smartphone → qualité magazine',
    model: 'Magnific + Photoroom',
    status: 'soon',
    icon: ImageIcon,
    color: 'from-amber-600 to-orange-700',
    badge: 'BIENTÔT',
    capabilities: ['Upscaling 4x', 'Recadrage intelligent', 'Suppression d\'objets', 'Application filtre brand'],
  },
  {
    id: 'video-creator',
    name: 'Video Creator',
    role: 'Photos → Reels & TikTok automatiques',
    model: 'Luma · Kling',
    status: 'soon',
    icon: Bot,
    color: 'from-rose-600 to-red-700',
    badge: 'BIENTÔT',
    capabilities: ['Image → vidéo 5s', 'Format multi-ratio', 'Sous-titres auto', 'Transitions IA'],
  },
]

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Bot className="w-7 h-7 text-purple-400" />
          Agents
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bibliothèque des agents spécialisés · {AGENTS.filter(a => a.status === 'active').length} actifs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTS.map(agent => {
          const Icon = agent.icon
          const isActive = agent.status === 'active'
          return (
            <div
              key={agent.id}
              className={`rounded-2xl p-5 border transition-all ${
                isActive
                  ? 'bg-gray-900/40 border-gray-800 hover:border-purple-700/50'
                  : 'bg-gray-900/20 border-gray-800/50 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${
                      isActive
                        ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40'
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}>
                      ● {agent.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{agent.role}</p>
                  <p className="text-[10px] text-gray-500 mt-1">🧠 {agent.model}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Capacités</div>
                <ul className="space-y-1">
                  {agent.capabilities.map((c, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-5 text-sm text-gray-300">
        💡 Les agents <strong>BIENTÔT</strong> nécessitent les API correspondantes (Magnific, Luma, Kling) — à connecter via la page Connexions.
      </div>
    </div>
  )
}
