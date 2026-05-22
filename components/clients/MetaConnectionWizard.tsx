'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2, ExternalLink,
  Eye, EyeOff, Send, Trash2, Stethoscope, ShieldCheck, ShieldAlert,
} from 'lucide-react'

// Inline icons for Facebook/Instagram (lucide-react removed them)
const Facebook = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35C.591 0 0 .593 0 1.325v21.351C0 23.408.591 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.325V1.325C24 .593 23.408 0 22.675 0z"/></svg>
)
const Instagram = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
)

interface DiscoveredPage {
  id: string
  name: string
  category: string
  accessToken: string
  pictureUrl?: string
  instagramAccount: {
    id: string
    username: string
    profilePictureUrl?: string
  } | null
}

interface DiscoverResult {
  userName: string
  pages: DiscoveredPage[]
  pagesWithInstagram: number
}

interface ConnectedAccount {
  platform: 'facebook' | 'instagram'
  handle: string | null
  accountId: string | null
  connectedAt: number | null
}

interface TokenDebugInfo {
  valid: boolean
  appId?: string
  type?: string
  application?: string
  expiresAt?: number | null
  scopes: string[]
  userId?: string
  pageName?: string
  pageId?: string
  hasRequiredPermissions: boolean
  missingPermissions: string[]
  error?: string
}

export function MetaConnectionWizard({
  clientId,
  clientName,
  existingAccounts,
}: {
  clientId: string
  clientName: string
  existingAccounts: ConnectedAccount[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<'token' | 'select' | 'connected'>(
    existingAccounts.some(a => a.platform === 'facebook') ? 'connected' : 'token'
  )
  const [userToken, setUserToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoverResult | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [connectInstagram, setConnectInstagram] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<TokenDebugInfo | null>(null)
  const [isPending, startTransition] = useTransition()

  const fbAccount = existingAccounts.find(a => a.platform === 'facebook')
  const igAccount = existingAccounts.find(a => a.platform === 'instagram')

  const handleDiscover = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/meta/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userToken }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur discovery')
        if (data.pages.length === 0) throw new Error('Aucune page trouvée. Vérifie que ton compte FB a accès à au moins une page.')
        setDiscovered(data)
        setStep('select')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  const handleConnect = () => {
    if (!discovered || !selectedPageId) return
    const page = discovered.pages.find(p => p.id === selectedPageId)
    if (!page) return

    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/meta/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            page,
            connectInstagram: connectInstagram && page.instagramAccount !== null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur connexion')
        setSuccess(`✅ ${page.name} connectée${page.instagramAccount && connectInstagram ? ` · Instagram @${page.instagramAccount.username}` : ''}`)
        setStep('connected')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  const handleTestPost = () => {
    setError(null)
    setSuccess(null)
    setDebugInfo(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/meta/test-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur test')
        setSuccess(`🚀 Test publié ! Va voir sur ta page Facebook (${data.handle})`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  const handleDebugToken = () => {
    setError(null)
    setSuccess(null)
    setDebugInfo(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/meta/debug-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, platform: 'facebook' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur debug')
        setDebugInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  const handleDisconnect = (platform: 'facebook' | 'instagram') => {
    if (!confirm(`Déconnecter ${platform} ?`)) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/meta/connect', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, platform }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erreur')
        }
        setSuccess(`${platform} déconnecté`)
        router.refresh()
        if (platform === 'facebook') setStep('token')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  // ─── State: Already connected ─────────────────────────────────────────────
  if (step === 'connected' && fbAccount) {
    return (
      <div className="space-y-4">
        {/* Facebook card */}
        <div className="bg-gradient-to-br from-blue-950/40 to-gray-900/40 border border-blue-700/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Facebook className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Facebook connecté</h3>
                <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 rounded-full px-2 py-0.5">● Actif</span>
              </div>
              <p className="text-sm text-blue-300 mt-0.5">{fbAccount.handle}</p>
              {fbAccount.connectedAt && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Connecté le {new Date(fbAccount.connectedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDisconnect('facebook')}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-red-700/50 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Instagram card */}
        {igAccount && (
          <div className="bg-gradient-to-br from-pink-950/40 to-gray-900/40 border border-pink-700/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">Instagram connecté</h3>
                  <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 rounded-full px-2 py-0.5">● Actif</span>
                </div>
                <p className="text-sm text-pink-300 mt-0.5">@{igAccount.handle}</p>
              </div>
              <button
                onClick={() => handleDisconnect('instagram')}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-red-700/50 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Diagnostic + Test */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">🧪 Tester & Diagnostiquer</h3>
              <p className="text-xs text-gray-500 mt-1">
                Vérifie que tout est bien configuré avant de publier en vrai.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDebugToken}
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg border border-blue-700/40 text-blue-300 hover:bg-blue-900/30 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              Diagnostiquer le token
            </button>
            <button
              onClick={handleTestPost}
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Test post réel
            </button>
          </div>
        </div>

        {/* Debug result */}
        {debugInfo && <TokenDebugPanel info={debugInfo} />}

        {success && <SuccessBanner message={success} />}
        {error && <ErrorBanner message={error} />}

        <div className="text-center pt-2">
          <button
            onClick={() => { setStep('token'); setUserToken(''); setDiscovered(null) }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Reconnecter avec un autre compte
          </button>
        </div>
      </div>
    )
  }

  // ─── State: Token input ──────────────────────────────────────────────────
  if (step === 'token') {
    return (
      <div className="space-y-4">
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-white">Étape 1 — Récupère ton User Access Token</h3>
            <p className="text-sm text-gray-400 mt-1">
              Va sur le Graph API Explorer, génère un token avec les permissions nécessaires, puis colle-le ci-dessous.
            </p>
          </div>

          <a
            href="https://developers.facebook.com/tools/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600/20 border border-blue-600/40 text-blue-300 hover:bg-blue-600/30 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir Graph API Explorer
          </a>

          <details className="text-xs text-gray-400 bg-gray-950/60 rounded-lg p-3 border border-gray-800">
            <summary className="cursor-pointer text-purple-300 font-medium">
              💡 Permissions nécessaires (clique pour voir)
            </summary>
            <div className="mt-2 space-y-0.5 font-mono">
              <div>✅ pages_show_list</div>
              <div>✅ pages_read_engagement</div>
              <div>✅ pages_manage_posts</div>
              <div>✅ pages_manage_metadata</div>
              <div>✅ instagram_basic</div>
              <div>✅ instagram_content_publish</div>
              <div>✅ business_management</div>
            </div>
          </details>

          <div>
            <label htmlFor="userToken" className="block text-xs text-gray-400 mb-1.5">
              Étape 2 — Colle ton User Access Token ici
            </label>
            <div className="relative">
              <input
                id="userToken"
                type={showToken ? 'text' : 'password'}
                value={userToken}
                onChange={e => setUserToken(e.target.value)}
                placeholder="EAA..."
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 pr-10 text-sm text-white font-mono placeholder:text-gray-700 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => setShowToken(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Le token commence par <code className="bg-gray-800 px-1 rounded">EAA</code> et fait ~200 caractères.
            </p>
          </div>

          <button
            onClick={handleDiscover}
            disabled={!userToken || isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Découverte des pages...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Découvrir mes pages</>
            )}
          </button>
        </div>

        {error && <ErrorBanner message={error} />}
      </div>
    )
  }

  // ─── State: Page selection ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="bg-purple-950/30 border border-purple-700/30 rounded-2xl p-4">
        <p className="text-sm text-white">
          ✅ Connecté en tant que <strong>{discovered?.userName}</strong>
        </p>
        <p className="text-xs text-purple-300 mt-1">
          {discovered?.pages.length} pages trouvées · {discovered?.pagesWithInstagram} avec Instagram lié
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-300 mb-3">
          Quelle page représente <strong className="text-white">{clientName}</strong> ?
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {discovered?.pages.map(page => (
            <label
              key={page.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPageId === page.id
                  ? 'bg-purple-950/40 border-purple-500'
                  : 'bg-gray-950/60 border-gray-800 hover:border-gray-700'
              }`}
            >
              <input
                type="radio"
                name="page"
                value={page.id}
                checked={selectedPageId === page.id}
                onChange={() => setSelectedPageId(page.id)}
                className="text-purple-600"
              />
              {page.pictureUrl ? (
                <img src={page.pictureUrl} alt="" className="w-10 h-10 rounded-lg" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{page.name}</div>
                <div className="text-[11px] text-gray-500">{page.category}</div>
              </div>
              {page.instagramAccount ? (
                <div className="flex items-center gap-1.5 text-[11px] text-pink-300 bg-pink-950/30 border border-pink-700/30 rounded px-2 py-1">
                  <Instagram className="w-3 h-3" />
                  @{page.instagramAccount.username}
                </div>
              ) : (
                <span className="text-[10px] text-gray-600">Pas d&apos;IG lié</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {selectedPageId && discovered?.pages.find(p => p.id === selectedPageId)?.instagramAccount && (
        <label className="flex items-center gap-2 p-3 rounded-lg bg-pink-950/20 border border-pink-700/30">
          <input
            type="checkbox"
            checked={connectInstagram}
            onChange={e => setConnectInstagram(e.target.checked)}
            className="text-pink-500"
          />
          <span className="text-sm text-gray-300">
            Connecter aussi Instagram <strong className="text-pink-300">@{discovered.pages.find(p => p.id === selectedPageId)?.instagramAccount?.username}</strong>
          </span>
        </label>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setStep('token')}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
        >
          ← Retour
        </button>
        <button
          onClick={handleConnect}
          disabled={!selectedPageId || isPending}
          className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Connecter à {clientName}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
    </div>
  )
}

function TokenDebugPanel({ info }: { info: TokenDebugInfo }) {
  const allGood = info.valid && info.hasRequiredPermissions
  const REQUIRED = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ]

  return (
    <div className={`rounded-2xl border p-5 ${
      allGood
        ? 'bg-emerald-950/30 border-emerald-700/40'
        : 'bg-amber-950/30 border-amber-700/40'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        {allGood ? (
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <h3 className={`font-semibold ${allGood ? 'text-emerald-300' : 'text-amber-300'}`}>
            {allGood ? 'Token valide — tout est OK' : 'Problème détecté sur le token'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {info.application && `App : ${info.application} · `}
            {info.type && `Type : ${info.type} · `}
            {info.pageName && `Page : ${info.pageName}`}
          </p>
          {info.expiresAt && (
            <p className="text-[11px] text-gray-500 mt-1">
              Expire {info.expiresAt > 0
                ? new Date(info.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'jamais (token long-lived)'
              }
            </p>
          )}
          {info.error && (
            <p className="text-xs text-red-400 mt-2">Erreur : {info.error}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Permissions</div>
        {REQUIRED.map(p => {
          const has = info.scopes.includes(p)
          return (
            <div key={p} className={`flex items-center gap-2 text-xs ${has ? 'text-emerald-300' : 'text-red-400'}`}>
              {has ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <code className="font-mono">{p}</code>
              {!has && <span className="text-[10px] text-gray-500">— manquante</span>}
            </div>
          )
        })}

        {info.scopes.filter(s => !REQUIRED.includes(s)).length > 0 && (
          <details className="mt-2">
            <summary className="text-[11px] text-gray-500 cursor-pointer">
              + {info.scopes.filter(s => !REQUIRED.includes(s)).length} autres permissions (non requises)
            </summary>
            <div className="mt-1 text-[11px] text-gray-600 font-mono">
              {info.scopes.filter(s => !REQUIRED.includes(s)).join(', ')}
            </div>
          </details>
        )}
      </div>

      {info.missingPermissions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-800/30">
          <p className="text-xs text-amber-300">
            💡 <strong>Pour corriger</strong> : déconnecte ce client, retourne sur le Graph API Explorer, ajoute les {info.missingPermissions.length} permission(s) manquante(s), regénère un User Access Token et reconnecte.
          </p>
        </div>
      )}
    </div>
  )
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-3 flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-emerald-300">{message}</p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-950/30 border border-red-700/40 rounded-xl p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-300">{message}</p>
    </div>
  )
}
