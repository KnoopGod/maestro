'use client'
import { useState } from 'react'
import { CheckCircle, Circle, Terminal } from 'lucide-react'
import { motion } from 'framer-motion'

interface Step {
  id: string
  title: string
  description: string
  command?: string
  link?: string
  status: 'done' | 'pending' | 'optional'
}

interface GuideSection {
  id: string
  title: string
  icon: string
  color: string
  borderColor: string
  steps: Step[]
}

const GUIDES: GuideSection[] = [
  {
    id: 'claude',
    title: 'Claude & Claude Code',
    icon: '👑',
    color: 'bg-purple-950/40',
    borderColor: 'border-purple-700/30',
    steps: [
      { id: 'c1', title: 'Abonnement Claude Pro actif', description: 'Vérifie que ton abonnement Claude est actif sur claude.ai', status: 'done' },
      { id: 'c2', title: 'Installer Claude Code CLI', description: 'Installe l\'interface en ligne de commande Claude Code', command: 'npm install -g @anthropic-ai/claude-code', status: 'done' },
      { id: 'c3', title: 'Authentification Claude Code', description: 'Connecte Claude Code à ton compte Anthropic', command: 'claude auth login', status: 'done' },
      { id: 'c4', title: 'Configurer CLAUDE.md', description: 'Crée un fichier CLAUDE.md à la racine de tes projets pour le contexte', status: 'pending' },
    ],
  },
  {
    id: 'chatgpt',
    title: 'ChatGPT',
    icon: '🎨',
    color: 'bg-emerald-950/40',
    borderColor: 'border-emerald-700/30',
    steps: [
      { id: 'gpt1', title: 'Abonnement ChatGPT Plus actif', description: 'Vérifie que ton abonnement ChatGPT Plus est actif', status: 'done' },
      { id: 'gpt2', title: 'Clé API OpenAI (optionnel)', description: 'Pour une intégration directe via API', command: 'export OPENAI_API_KEY=sk-...', status: 'optional' },
      { id: 'gpt3', title: 'Activer DALL-E 3 dans ChatGPT', description: 'S\'assure que la génération d\'image est activée dans tes paramètres', status: 'done' },
      { id: 'gpt4', title: 'Configurer GPT-4o', description: 'Sélectionne GPT-4o comme modèle par défaut pour les tâches multimodales', status: 'pending' },
    ],
  },
  {
    id: 'ollama',
    title: 'Ollama Local (Mac M3)',
    icon: '🏠',
    color: 'bg-amber-950/40',
    borderColor: 'border-amber-700/30',
    steps: [
      { id: 'o1', title: 'Installer Ollama', description: 'Télécharge et installe Ollama pour Mac M3', command: 'brew install ollama', status: 'pending' },
      { id: 'o2', title: 'Démarrer le serveur Ollama', description: 'Lance le daemon Ollama en arrière-plan', command: 'ollama serve', status: 'pending' },
      { id: 'o3', title: 'Télécharger llama3.2:3b', description: 'Modèle léger, optimisé Mac M3, idéal pour tâches simples', command: 'ollama pull llama3.2:3b', status: 'pending' },
      { id: 'o4', title: 'Tester le modèle', description: 'Vérifie que Ollama répond correctement', command: 'ollama run llama3.2:3b "Dis bonjour"', status: 'pending' },
      { id: 'o5', title: 'Optionnel : mistral:7b', description: 'Modèle plus puissant pour tâches intermédiaires (nécessite ~8 Go RAM)', command: 'ollama pull mistral:7b', status: 'optional' },
    ],
  },
  {
    id: 'future',
    title: 'Futures intégrations',
    icon: '◎',
    color: 'bg-gray-900/40',
    borderColor: 'border-gray-700/30',
    steps: [
      { id: 'f1', title: 'Gemini API (Google)', description: 'Intégration de Gemini Pro pour une alternative puissante', status: 'optional' },
      { id: 'f2', title: 'Groq (ultra-rapide)', description: 'API Groq pour des inférences extrêmement rapides', status: 'optional' },
      { id: 'f3', title: 'n8n — Automatisation', description: 'Connecter n8n pour les workflows et publications automatiques', command: 'npm install -g n8n', status: 'optional' },
      { id: 'f4', title: 'Serveur GPU (Runpod)', description: 'Pour les modèles 70B+ et la génération vidéo locale', status: 'optional' },
    ],
  },
]

const STATUS_ICON = {
  done:     { icon: CheckCircle, color: 'text-green-400' },
  pending:  { icon: Circle,      color: 'text-gray-600' },
  optional: { icon: Circle,      color: 'text-gray-700' },
}

export default function SetupGuidePage() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(GUIDES.flatMap(g => g.steps.filter(s => s.status === 'done').map(s => s.id)))
  )

  const toggleStep = (id: string) => {
    const next = new Set(completedSteps)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCompletedSteps(next)
  }

  const totalSteps = GUIDES.flatMap(g => g.steps.filter(s => s.status !== 'optional')).length
  const doneSteps = GUIDES.flatMap(g => g.steps.filter(s => s.status !== 'optional' && completedSteps.has(s.id))).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Setup Guide</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure chaque IA étape par étape</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{doneSteps}/{totalSteps}</div>
          <div className="text-[11px] text-gray-500">étapes complétées</div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${(doneSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {GUIDES.map((guide, gi) => {
          const guideDone = guide.steps.filter(s => s.status !== 'optional' && completedSteps.has(s.id)).length
          const guideTotal = guide.steps.filter(s => s.status !== 'optional').length

          return (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1 }}
              className={`rounded-xl border overflow-hidden ${guide.color} ${guide.borderColor}`}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{guide.icon}</span>
                  <span className="font-semibold text-white">{guide.title}</span>
                </div>
                <span className="text-xs text-gray-400">{guideDone}/{guideTotal} complétés</span>
              </div>

              <div className="divide-y divide-white/5">
                {guide.steps.map((step) => {
                  const isDone = completedSteps.has(step.id)
                  const { icon: Icon, color } = STATUS_ICON[isDone ? 'done' : step.status]

                  return (
                    <div key={step.id} className={`flex items-start gap-4 p-4 ${step.status === 'optional' ? 'opacity-50' : ''}`}>
                      <button onClick={() => toggleStep(step.id)} className="mt-0.5 flex-shrink-0">
                        <Icon className={`w-5 h-5 ${isDone ? 'text-green-400' : color} transition-colors`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                            {step.title}
                          </span>
                          {step.status === 'optional' && (
                            <span className="text-[10px] bg-gray-800 text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">Optionnel</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                        {step.command && (
                          <div className="mt-2 flex items-center gap-2 bg-gray-950/80 border border-gray-700 rounded-lg px-3 py-2">
                            <Terminal className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <code className="text-xs text-emerald-400 font-mono">{step.command}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
