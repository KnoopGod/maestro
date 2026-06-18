'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, ExternalLink, Eye, EyeOff, X,
  Loader2, AlertCircle, Plug, Bot, Share2, ImageIcon,
  Copy, Check, RefreshCw, ChevronRight, Sparkles
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'connected' | 'disconnected' | 'error'
type Category = 'ai' | 'social' | 'image'

interface Step {
  title: string
  description: string
  link?: { label: string; url: string }
}

interface Integration {
  id: string
  name: string
  category: Category
  description: string
  color: string
  bg: string
  border: string
  emoji: string
  authType: 'apikey' | 'oauth'
  keyLabel?: string
  keyPlaceholder?: string
  steps: Step[]
  docsUrl: string
}

// ─── Integrations Data ───────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  // ── IA Providers ──
  {
    id: 'anthropic', name: 'Anthropic Claude', category: 'ai',
    description: 'Claude Sonnet & Opus — génération de texte premium',
    color: 'text-purple-300', bg: 'bg-purple-950/40', border: 'border-purple-700/30',
    emoji: '👑', authType: 'apikey', keyLabel: 'Clé API Anthropic', keyPlaceholder: 'sk-ant-api03-...',
    docsUrl: 'https://console.anthropic.com/account/keys',
    steps: [
      { title: 'Créer un compte Anthropic', description: 'Rends-toi sur console.anthropic.com et connecte-toi.', link: { label: 'Ouvrir Anthropic Console', url: 'https://console.anthropic.com' } },
      { title: 'Générer une clé API', description: 'Va dans Settings → API Keys → Create Key. Copie la clé immédiatement, elle ne sera plus visible.' },
      { title: 'Coller la clé ci-dessous', description: 'La clé commence toujours par "sk-ant-api03-".' },
    ],
  },
  {
    id: 'openai', name: 'OpenAI GPT-4', category: 'ai',
    description: 'GPT-4o + DALL-E 3 — texte et images via une seule clé',
    color: 'text-emerald-300', bg: 'bg-emerald-950/40', border: 'border-emerald-700/30',
    emoji: '🎨', authType: 'apikey', keyLabel: 'Clé API OpenAI', keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    steps: [
      { title: 'Créer un compte OpenAI', description: 'Connecte-toi sur platform.openai.com', link: { label: 'Ouvrir OpenAI Platform', url: 'https://platform.openai.com' } },
      { title: 'Générer une clé API', description: 'Va dans API Keys → Create new secret key. Donne-lui un nom comme "social-ai-tool".', link: { label: 'API Keys', url: 'https://platform.openai.com/api-keys' } },
      { title: 'Coller la clé ci-dessous', description: 'La clé commence par "sk-proj-". Cette clé donne accès à GPT-4o ET DALL-E 3.' },
    ],
  },
  {
    id: 'google', name: 'Google Gemini', category: 'ai',
    description: 'Gemini 1.5 Pro — multimodal, contexte très long',
    color: 'text-blue-300', bg: 'bg-blue-950/40', border: 'border-blue-700/30',
    emoji: '🔷', authType: 'apikey', keyLabel: 'Clé API Google AI', keyPlaceholder: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    steps: [
      { title: 'Ouvrir Google AI Studio', description: 'Connecte-toi avec ton compte Google sur aistudio.google.com', link: { label: 'Ouvrir AI Studio', url: 'https://aistudio.google.com' } },
      { title: 'Créer une clé API', description: 'Clique sur "Get API key" → Create API key in new project.', link: { label: 'Créer la clé', url: 'https://aistudio.google.com/app/apikey' } },
      { title: 'Coller la clé ci-dessous', description: 'La clé commence par "AIzaSy".' },
    ],
  },
  {
    id: 'groq', name: 'Groq', category: 'ai',
    description: 'Inférence ultra-rapide — idéal pour les drafts et aperçus',
    color: 'text-orange-300', bg: 'bg-orange-950/40', border: 'border-orange-700/30',
    emoji: '⚡', authType: 'apikey', keyLabel: 'Clé API Groq', keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    steps: [
      { title: 'Créer un compte Groq', description: 'Inscris-toi sur console.groq.com — gratuit.', link: { label: 'Ouvrir Groq Console', url: 'https://console.groq.com' } },
      { title: 'Générer une clé API', description: 'Va dans API Keys → Create API Key.', link: { label: 'API Keys', url: 'https://console.groq.com/keys' } },
      { title: 'Coller la clé ci-dessous', description: 'La clé commence par "gsk_".' },
    ],
  },
  {
    id: 'mistral', name: 'Mistral AI', category: 'ai',
    description: 'Modèles européens RGPD-friendly — Mistral Large & Small',
    color: 'text-red-300', bg: 'bg-red-950/40', border: 'border-red-700/30',
    emoji: '🌪️', authType: 'apikey', keyLabel: 'Clé API Mistral', keyPlaceholder: '...',
    docsUrl: 'https://console.mistral.ai/api-keys',
    steps: [
      { title: 'Créer un compte Mistral', description: 'Inscris-toi sur console.mistral.ai', link: { label: 'Ouvrir Mistral Console', url: 'https://console.mistral.ai' } },
      { title: 'Générer une clé API', description: 'Va dans API Keys → Créer une nouvelle clé.', link: { label: 'API Keys', url: 'https://console.mistral.ai/api-keys' } },
      { title: 'Coller la clé ci-dessous', description: 'Note : Mistral est hébergé en Europe, données RGPD conformes.' },
    ],
  },

  // ── Réseaux Sociaux ──
  {
    id: 'meta', name: 'Instagram / Facebook', category: 'social',
    description: 'Poster sur Instagram & Facebook via Meta Graph API',
    color: 'text-pink-300', bg: 'bg-pink-950/40', border: 'border-pink-700/30',
    emoji: '📸', authType: 'apikey', keyLabel: 'Token d\'accès Meta', keyPlaceholder: 'EAAxxxxxxx...',
    docsUrl: 'https://developers.facebook.com/apps',
    steps: [
      { title: 'Créer une app Meta Developer', description: 'Va sur developers.facebook.com → Mes Apps → Créer une app. Choisis "Business".', link: { label: 'Meta for Developers', url: 'https://developers.facebook.com/apps' } },
      { title: 'Activer Instagram Graph API', description: 'Dans ton app → Ajouter des produits → Instagram Graph API. Connecte ton compte Instagram Business.' },
      { title: 'Générer un token longue durée', description: 'Dans l\'Explorateur d\'API → Génère un token avec les permissions: instagram_basic, instagram_content_publish, pages_show_list.' },
      { title: 'Coller le token ci-dessous', description: 'Le token commence par "EAA". Il dure 60 jours (renouvellement automatique configuré).' },
    ],
  },
  {
    id: 'linkedin', name: 'LinkedIn', category: 'social',
    description: 'Poster sur votre page LinkedIn Company ou profil',
    color: 'text-sky-300', bg: 'bg-sky-950/40', border: 'border-sky-700/30',
    emoji: '💼', authType: 'apikey', keyLabel: 'Token LinkedIn', keyPlaceholder: 'AQxxxxxxx...',
    docsUrl: 'https://www.linkedin.com/developers/apps',
    steps: [
      { title: 'Créer une app LinkedIn', description: 'Va sur linkedin.com/developers/apps → Create App. Associe-la à une Page LinkedIn.', link: { label: 'LinkedIn Developer Portal', url: 'https://www.linkedin.com/developers/apps' } },
      { title: 'Activer les permissions', description: 'Dans Auth → Request access : w_member_social, r_liteprofile, w_organization_social.' },
      { title: 'Générer un token OAuth', description: 'Utilise OAuth 2.0 → Authorize. Copie l\'access_token retourné.' },
      { title: 'Coller le token ci-dessous', description: 'Token commençant par "AQ".' },
    ],
  },
  {
    id: 'twitter', name: 'X / Twitter', category: 'social',
    description: 'Poster des tweets et threads via Twitter API v2',
    color: 'text-gray-300', bg: 'bg-gray-900/60', border: 'border-gray-700/40',
    emoji: '🐦', authType: 'apikey', keyLabel: 'Bearer Token X/Twitter', keyPlaceholder: 'AAAA...',
    docsUrl: 'https://developer.twitter.com/en/portal/dashboard',
    steps: [
      { title: 'Accéder au Developer Portal', description: 'Va sur developer.twitter.com et connecte-toi. Tu auras besoin d\'un compte vérifié.', link: { label: 'Twitter Developer Portal', url: 'https://developer.twitter.com/en/portal/dashboard' } },
      { title: 'Créer un projet & app', description: 'New Project → New App. Choisis "Free" tier (1500 tweets/mois).' },
      { title: 'Générer les clés', description: 'Dans Keys & Tokens → Bearer Token → Generate. Copie-le.' },
      { title: 'Coller le Bearer Token ci-dessous', description: 'Commence par "AAAA". Pour poster tu as aussi besoin des Access Token & Secret.' },
    ],
  },
  {
    id: 'tiktok', name: 'TikTok', category: 'social',
    description: 'Publier des vidéos et images sur TikTok Business',
    color: 'text-rose-300', bg: 'bg-rose-950/40', border: 'border-rose-700/30',
    emoji: '🎵', authType: 'apikey', keyLabel: 'Client Key TikTok', keyPlaceholder: 'awxxxxxxx...',
    docsUrl: 'https://developers.tiktok.com',
    steps: [
      { title: 'Créer une app TikTok for Developers', description: 'Va sur developers.tiktok.com → Manage Apps → Connect.', link: { label: 'TikTok for Developers', url: 'https://developers.tiktok.com' } },
      { title: 'Activer Content Posting API', description: 'Dans ton app → Products → Content Posting API. Soumets pour approbation (24-48h).' },
      { title: 'Récupérer le Client Key', description: 'Dans App Detail → Client Key & Client Secret.' },
      { title: 'Coller le Client Key ci-dessous', description: 'Note: TikTok nécessite un compte Business pour le posting automatisé.' },
    ],
  },

  // ── Génération Images ──
  {
    id: 'dalle', name: 'DALL-E 3', category: 'image',
    description: 'Via clé OpenAI déjà configurée — qualité premium, rapide',
    color: 'text-emerald-300', bg: 'bg-emerald-950/40', border: 'border-emerald-700/30',
    emoji: '🖼️', authType: 'apikey', keyLabel: 'Même clé que OpenAI', keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/docs/api-reference/images',
    steps: [
      { title: 'Utilise ta clé OpenAI', description: 'DALL-E 3 est inclus dans l\'API OpenAI. Si OpenAI est connecté, DALL-E 3 est automatiquement disponible.' },
      { title: 'Vérifier les crédits', description: 'Assure-toi d\'avoir des crédits API sur ton compte OpenAI. DALL-E 3 coûte ~$0.04/image (1024×1024).', link: { label: 'Vérifier les crédits', url: 'https://platform.openai.com/account/usage' } },
      { title: 'Coller la clé OpenAI ci-dessous', description: 'Si OpenAI est déjà configuré ci-dessus, récupère la même clé.' },
    ],
  },
  {
    id: 'replicate', name: 'Stable Diffusion', category: 'image',
    description: 'Via Replicate — SDXL, Flux, modèles open-source',
    color: 'text-yellow-300', bg: 'bg-yellow-950/40', border: 'border-yellow-700/30',
    emoji: '🎭', authType: 'apikey', keyLabel: 'Token Replicate', keyPlaceholder: 'r8_...',
    docsUrl: 'https://replicate.com/account/api-tokens',
    steps: [
      { title: 'Créer un compte Replicate', description: 'Inscris-toi sur replicate.com — tu as droit à un crédit gratuit.', link: { label: 'Ouvrir Replicate', url: 'https://replicate.com' } },
      { title: 'Générer un token API', description: 'Va dans Account Settings → API Tokens → Create token.', link: { label: 'API Tokens', url: 'https://replicate.com/account/api-tokens' } },
      { title: 'Coller le token ci-dessous', description: 'Commence par "r8_". Permet d\'accéder à SDXL, Flux et des centaines de modèles.' },
    ],
  },
  {
    id: 'ideogram', name: 'Ideogram', category: 'image',
    description: 'Excellent pour le texte dans les images — posts avec slogans',
    color: 'text-violet-300', bg: 'bg-violet-950/40', border: 'border-violet-700/30',
    emoji: '✍️', authType: 'apikey', keyLabel: 'Clé API Ideogram', keyPlaceholder: 'ideogram-...',
    docsUrl: 'https://ideogram.ai/manage-api',
    steps: [
      { title: 'Créer un compte Ideogram', description: 'Inscris-toi sur ideogram.ai — le meilleur outil pour générer du texte dans les images.', link: { label: 'Ouvrir Ideogram', url: 'https://ideogram.ai' } },
      { title: 'Activer l\'accès API', description: 'Va dans Settings → API → Generate API Key.', link: { label: 'Manage API', url: 'https://ideogram.ai/manage-api' } },
      { title: 'Coller la clé ci-dessous', description: 'Idéal pour les posts avec texte/slogan intégré dans l\'image.' },
    ],
  },
  {
    id: 'firefly', name: 'Adobe Firefly', category: 'image',
    description: 'Images copyright-safe pour usage commercial garanti',
    color: 'text-red-300', bg: 'bg-red-950/40', border: 'border-red-700/30',
    emoji: '🔥', authType: 'apikey', keyLabel: 'Client ID Adobe', keyPlaceholder: 'xxxxxxxxxxxxxxxx',
    docsUrl: 'https://developer.adobe.com/firefly-api/',
    steps: [
      { title: 'Créer une app Adobe Developer', description: 'Va sur developer.adobe.com → Console → Create Project → Add Firefly API.', link: { label: 'Adobe Developer Console', url: 'https://developer.adobe.com/console' } },
      { title: 'Récupérer le Client ID', description: 'Dans ton projet → Credentials → Client ID & Client Secret.' },
      { title: 'Coller le Client ID ci-dessous', description: '⭐ Avantage clé : toutes les images générées sont safe pour usage commercial — aucun risque copyright.' },
    ],
  },
]

const CATEGORIES = [
  { id: 'ai' as Category, label: 'Modèles IA', icon: Bot, color: 'text-purple-400' },
  { id: 'social' as Category, label: 'Réseaux Sociaux', icon: Share2, color: 'text-pink-400' },
  { id: 'image' as Category, label: 'Génération Images', icon: ImageIcon, color: 'text-yellow-400' },
]

// ─── Wizard Modal ─────────────────────────────────────────────────────────────

function WizardModal({
  integration,
  onClose,
  onSave,
}: {
  integration: Integration
  onClose: () => void
  onSave: (id: string, key: string) => void
}) {
  const [step, setStep] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [copied, setCopied] = useState(false)

  const totalSteps = integration.steps.length
  const isLastStep = step === totalSteps - 1

  const handleTest = async () => {
    if (!apiKey.trim()) return
    setTesting(true)
    setTestResult(null)
    await new Promise(r => setTimeout(r, 1800))
    // Client-side format check only. Secrets must be stored in Vercel/server env.
    setTestResult(apiKey.length > 10 ? 'success' : 'error')
    setTesting(false)
  }

  const handleSave = () => {
    onSave(integration.id, apiKey)
    onClose()
  }

  const copyExample = () => {
    navigator.clipboard.writeText(integration.keyPlaceholder || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Modal */}
      <motion.div
        className={`relative w-full max-w-lg rounded-2xl border ${integration.bg} ${integration.border} shadow-2xl overflow-hidden`}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.emoji}</span>
            <div>
              <h2 className={`font-bold text-white`}>Connecter {integration.name}</h2>
              <p className="text-xs text-gray-400">{integration.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 mb-1">
            {integration.steps.map((_, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-purple-500' : 'bg-gray-800'
                }`} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500">Étape {step + 1} sur {totalSteps}</p>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step < totalSteps - 1 ? (
                // Instruction steps
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    {integration.steps[step].title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {integration.steps[step].description}
                  </p>
                  {integration.steps[step].link && (
                    <a
                      href={integration.steps[step].link!.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border ${integration.border} ${integration.color} hover:bg-white/10 transition-colors`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {integration.steps[step].link!.label}
                    </a>
                  )}
                </div>
              ) : (
                // API key input step
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    {integration.steps[step].title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {integration.steps[step].description}
                  </p>

                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    {integration.keyLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={integration.keyPlaceholder}
                      className="w-full bg-gray-950/80 border border-gray-700 rounded-xl px-4 py-3 pr-20 text-sm text-white font-mono placeholder:text-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Format hint */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-gray-600">Format :</span>
                    <code className="text-[11px] text-gray-500 font-mono">{integration.keyPlaceholder}</code>
                    <button onClick={copyExample} className="ml-auto">
                      {copied
                        ? <Check className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 transition-colors" />
                      }
                    </button>
                  </div>

                  {/* Test connection */}
                  <div className="mt-4">
                    <button
                      onClick={handleTest}
                      disabled={!apiKey.trim() || testing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {testing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />
                      }
                      Vérifier le format
                    </button>

                    <AnimatePresence>
                      {testResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                            testResult === 'success'
                              ? 'bg-green-950/40 border-green-700/30 text-green-400'
                              : 'bg-red-950/40 border-red-700/30 text-red-400'
                          }`}
                        >
                          {testResult === 'success'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <AlertCircle className="w-4 h-4" />
                          }
                          {testResult === 'success'
                            ? 'Format accepté — ajoute la clé côté serveur/Vercel si nécessaire'
                            : 'Format trop court ou incomplet'
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {step === 0 ? 'Annuler' : '← Retour'}
          </button>

          {isLastStep ? (
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || testResult !== 'success'}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marquer comme guidé
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  status,
  onConnect,
  onDisconnect,
}: {
  integration: Integration
  status: Status
  onConnect: () => void
  onDisconnect: () => void
}) {
  const isConnected = status === 'connected'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${integration.bg} ${integration.border} flex items-start gap-4 group transition-all hover:border-white/20`}
    >
      <div className="text-2xl mt-0.5">{integration.emoji}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-semibold text-sm text-white`}>{integration.name}</span>
          {isConnected && (
            <span className="flex items-center gap-1 text-[10px] bg-green-950/60 text-green-400 border border-green-700/30 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Guide fait
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{integration.description}</p>
      </div>

      <div className="flex-shrink-0">
        {isConnected ? (
          <button
            onClick={onDisconnect}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-red-700/50 hover:text-red-400 transition-all"
          >
            Réinitialiser
          </button>
        ) : (
          <button
            onClick={onConnect}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${integration.border} ${integration.color} hover:bg-white/10 transition-all`}
          >
            <Plug className="w-3.5 h-3.5" />
            Connecter
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'social_connections'

export default function ConnectionsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('ai')
  const [activeWizard, setActiveWizard] = useState<Integration | null>(null)
  const [connections, setConnections] = useState<Record<string, Status>>({})

  // Persist connections in localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setConnections(JSON.parse(saved))
      } catch {}
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const saveConnection = (id: string) => {
    const next = { ...connections, [id]: 'connected' as Status }
    setConnections(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const disconnect = (id: string) => {
    const next = { ...connections }
    delete next[id]
    setConnections(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const filtered = INTEGRATIONS.filter(i => i.category === activeCategory)
  const connectedCount = Object.values(connections).filter(s => s === 'connected').length
  const totalCount = INTEGRATIONS.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plug className="w-6 h-6 text-purple-400" />
            Connexions & Intégrations
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Guide pas-à-pas pour connecter toutes tes API — texte, image et réseaux sociaux
          </p>
        </div>

        {/* Global status */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-5 py-3 text-center min-w-[120px]">
          <div className="text-2xl font-bold text-purple-400">{connectedCount}/{totalCount}</div>
          <div className="text-[11px] text-gray-500">guidées</div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(connectedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map(({ id, label, icon: Icon, color }) => {
          const count = INTEGRATIONS.filter(i => i.category === id && connections[i.id] === 'connected').length
          const total = INTEGRATIONS.filter(i => i.category === id).length
          const active = activeCategory === id
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                active
                  ? 'bg-purple-600/20 border-purple-500/30 text-white'
                  : 'border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? color : 'text-gray-500'}`} />
              {label}
              <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${
                count > 0 ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-600'
              }`}>
                {count}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pro tip banner */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 bg-purple-950/30 border border-purple-700/20 rounded-xl px-4 py-3"
      >
        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          {activeCategory === 'ai' && 'Connecte au moins Anthropic Claude pour activer la génération de texte. OpenAI est recommandé en fallback pour les images DALL-E.'}
          {activeCategory === 'social' && 'Connecte les réseaux de tes clients. Chaque client peut avoir ses propres tokens — configurés dans son profil.'}
          {activeCategory === 'image' && 'DALL-E 3 (via OpenAI) est le plus simple à configurer. Ideogram est recommandé pour les posts avec texte intégré dans l\'image.'}
        </p>
      </motion.div>

      {/* Integration cards */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-3"
      >
        {filtered.map((integration, i) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <IntegrationCard
              integration={integration}
              status={connections[integration.id] || 'disconnected'}
              onConnect={() => setActiveWizard(integration)}
              onDisconnect={() => disconnect(integration.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Docs link */}
      <div className="flex items-center justify-center pt-2">
        <a
          href="https://voltagent.dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Documentation complète VoltAgent
        </a>
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {activeWizard && (
          <WizardModal
            integration={activeWizard}
            onClose={() => setActiveWizard(null)}
            onSave={saveConnection}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
