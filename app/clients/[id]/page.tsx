import type React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, CalendarDays, BarChart3, Settings2, Bot, Edit3, FolderOpen, Plug, CheckCircle2, Clock, AlertCircle, Euro, FileText, Rocket } from 'lucide-react'
import { getClient, getAiStrategy } from '@/lib/db/queries/clients'
import { getClientAssetSummary, getVisualIdentity } from '@/lib/db/queries/assets'
import { listPosts } from '@/lib/db/queries/posts'
import { listClientSocialAccountSummaries } from '@/lib/db/queries/social-accounts'
import { listJobsByClient } from '@/lib/db/queries/agent-jobs'
import type { AgentJob } from '@/lib/db/queries/agent-jobs'
import { CLIENT_TYPES, CLIENT_STATUS } from '@/types/client'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'
import { StrategyPanel } from '@/components/clients/StrategyPanel'
import { PortalLinkCard } from '@/components/clients/PortalLinkCard'
import type { StrategyAdvice } from '@/lib/agents/strategy-advisor'
import type { Post } from '@/types/post'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const [assetSummary, identity, aiStrategy, socialAccounts, clientPosts, clientJobs] = await Promise.all([
    getClientAssetSummary(id),
    getVisualIdentity(id),
    getAiStrategy(id),
    listClientSocialAccountSummaries(id),
    listPosts({ clientId: id, limit: 100, includeInsights: false }),
    listJobsByClient(id, 8),
  ])

  const scheduledCount = clientPosts.filter(p => p.status === 'scheduled').length
  const publishedPosts = clientPosts.filter(p => p.status === 'published')
  const contentPillars = client.strategy?.contentPillars ?? []
  const setupComplete = Boolean(client.description && client.brandVoiceTone && contentPillars.length > 0)
  const facebookConnected = socialAccounts.some(a => a.platform === 'facebook')
  const instagramConnected = socialAccounts.some(a => a.platform === 'instagram')
  const metaConnected = facebookConnected && instagramConnected
  const daAnalyzed = Boolean(identity?.stylePrompt)
  const firstPostReady = clientPosts.length > 0
  const avgImpact = publishedPosts.length
    ? publishedPosts.reduce((s, p) => s + p.impactScore, 0) / publishedPosts.length
    : null
  const recentPosts = clientPosts.slice(0, 4)

  const typeCfg = CLIENT_TYPES[client.type]
  const statusCfg = CLIENT_STATUS[client.status]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <Link href="/clients" title="Retourner à la liste complète des clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 pb-6 border-b border-gray-800">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${client.color} flex items-center justify-center text-4xl shadow-lg flex-shrink-0`}>
          {client.emoji}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{client.name}</h1>
            <span className={`text-[11px] border rounded-full px-2 py-0.5 ${statusCfg.color}`}>
              ● {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {typeCfg.label}{client.city ? ` · ${client.city}` : ''}
          </p>
          {client.description && (
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">{client.description}</p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/studio?client=${client.id}`}
            title={`Créer un post complet pour ${client.name}`}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Créer un post
          </Link>
          <Link
            href={`/clients/${client.id}/setup`}
            title="Ouvrir le tunnel guidé de démarrage client"
            className="px-3 py-2 rounded-lg border border-purple-700/40 hover:bg-purple-900/30 text-purple-300 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Plug className="w-4 h-4" />
            Tunnel
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            title={`Modifier le profil, la stratégie et la voix de marque de ${client.name}`}
            className="px-3 py-2 rounded-lg border border-gray-800 hover:bg-gray-800 text-gray-300 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Éditer
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Link href={`/clients/${client.id}/launch`} title="Tunnel guidé : unifier, configurer et connecter les réseaux sociaux du client en 5 étapes" className="bg-gradient-to-br from-indigo-950/40 to-blue-950/30 border border-indigo-700/30 rounded-xl p-4 hover:border-indigo-500/50 transition-all flex items-center gap-3 group">
          <Rocket className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Lancement</div>
            <div className="text-[11px] text-gray-500">Tunnel 5 étapes</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/library`} title="Ajouter photos, vidéos, logos et documents de DA du client" className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-xl p-4 hover:border-purple-500/50 transition-all flex items-center gap-3 group">
          <FolderOpen className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Bibliothèque</div>
            <div className="text-[11px] text-gray-500">{assetSummary.total} éléments{identity?.stylePrompt ? ' · DA' : ''}</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/agents`} title="Voir les agents IA qui ont travaillé pour ce client et leurs livrables" className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <Bot className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Agents</div>
            <div className="text-[11px] text-gray-500">{clientPosts.length} générations</div>
          </div>
        </Link>

        <Link href={`/plan?client=${client.id}`} title="Voir les posts planifiés, publiés et en préparation pour ce client" className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <CalendarDays className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Calendrier</div>
            <div className="text-[11px] text-gray-500">{scheduledCount > 0 ? `${scheduledCount} planifié${scheduledCount > 1 ? 's' : ''}` : 'Aucun planifié'}</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/analytics`} title="Voir les performances des posts publiés et récupérer les insights Meta" className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <BarChart3 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Analytics</div>
            <div className="text-[11px] text-gray-500">{avgImpact != null ? `Impact ${avgImpact.toFixed(0)}/100` : 'Aucun post publié'}</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/finance`} title="Suivre le coût IA/API, le budget client et la marge de rentabilité" className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-emerald-700/50 transition-all flex items-center gap-3 group">
          <Euro className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Rentabilité</div>
            <div className="text-[11px] text-gray-500">Marge · Budget</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/connections`} title="Connecter Facebook, Instagram et les plateformes nécessaires pour publier" className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <Settings2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Connexions</div>
            <div className="text-[11px] text-gray-500">Meta · IG · TikTok</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/report`} title="Préparer un bilan mensuel imprimable ou exportable en PDF pour le client" className="bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-700/30 rounded-xl p-4 hover:border-emerald-500/50 transition-all flex items-center gap-3 group">
          <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Bilan mensuel</div>
            <div className="text-[11px] text-gray-500">Livrable client · PDF</div>
          </div>
        </Link>
      </div>

      <PortalLinkCard clientId={client.id} />

      {/* V1 startup checklist */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Checklist de démarrage</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Les 4 prérequis pour passer du profil client au premier post publié.
            </p>
          </div>
          <Link
            href={`/clients/${client.id}/setup`}
            title="Ouvrir le guide complet pour terminer les étapes manquantes"
            className="text-xs text-purple-300 hover:underline flex-shrink-0"
          >
            Ouvrir le guide →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <StartupStep
            done={setupComplete}
            label="Setup"
            detail={setupComplete ? 'Profil prêt' : 'Compléter profil'}
            href={`/clients/${client.id}/edit`}
          />
          <StartupStep
            done={metaConnected}
            label="Meta connecté"
            detail={metaConnected ? 'FB/IG disponible' : facebookConnected ? 'Instagram à ajouter' : 'Connecter Meta'}
            href={`/clients/${client.id}/connections`}
          />
          <StartupStep
            done={daAnalyzed}
            label="DA analysée"
            detail={daAnalyzed ? 'Style actif' : 'Importer/analyser'}
            href={`/clients/${client.id}/library`}
          />
          <StartupStep
            done={firstPostReady}
            label="Premier post"
            detail={firstPostReady ? `${clientPosts.length} post${clientPosts.length > 1 ? 's' : ''}` : 'Créer le premier'}
            href={`/studio?client=${client.id}`}
          />
        </div>
      </div>

      {contentPillars.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-3">
            Piliers de contenu
          </div>
          <div className="flex flex-wrap gap-2">
            {contentPillars.map(pillar => (
              <Link
                key={pillar}
                href={`/studio?client=${client.id}&pillar=${encodeURIComponent(pillar)}`}
                title={`Créer un post pour ${client.name} autour du pilier : ${pillar}`}
                className="px-2.5 py-1.5 rounded-full bg-purple-950/30 border border-purple-700/30 text-xs text-purple-200 hover:bg-purple-900/40 hover:border-purple-500/50 transition-colors"
              >
                {pillar}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* DA Banner if identity exists */}
      {identity && identity.stylePrompt && (
        <div className="bg-gradient-to-r from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-3xl">✨</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              Direction Artistique active
              <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 rounded-full px-2 py-0.5">
                injectée dans les générations
              </span>
            </div>
            <p className="text-sm text-gray-300">{identity.visualSummary}</p>
            <div className="flex items-center gap-2 mt-2">
              {identity.palette.slice(0, 5).map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-md border border-gray-700" style={{ backgroundColor: c }} title={c} />
              ))}
              <span className="text-[10px] text-purple-300 ml-2">
                {identity.styleKeywords.slice(0, 3).join(' · ')}
              </span>
            </div>
          </div>
          <Link
            href={`/clients/${client.id}/library`}
            title="Gérer les ressources et mettre à jour la direction artistique analysée"
            className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30"
          >
            Gérer →
          </Link>
        </div>
      )}

      {/* Brand Voice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              🎯 Identité de marque
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Ton</dt>
                <dd className="text-gray-200">{client.brandVoiceTone || <span className="text-gray-600 italic">Non défini</span>}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Mots-clés</dt>
                <dd className="text-gray-200">
                  {client.brandVoiceKeywords
                    ? client.brandVoiceKeywords.split(',').map((k, i, arr) => (
                        <span key={i} className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded bg-purple-900/30 border border-purple-700/30 text-purple-300 text-xs">
                          {k.trim()}{i < arr.length - 1 ? ' ' : ''}
                        </span>
                      ))
                    : <span className="text-gray-600 italic">Non définis</span>
                  }
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">À éviter</dt>
                <dd className="text-gray-400 text-xs italic">
                  {client.brandVoiceAvoid || <span className="text-gray-600">Aucun</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Langues</dt>
                <dd className="flex gap-1.5">
                  {client.languages.map(l => (
                    <span key={l} className="px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/30 text-blue-300 text-xs uppercase">
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <StrategyPanel clientId={id} initial={aiStrategy as StrategyAdvice | null} />
        </div>

        {/* Connected platforms — real data */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            🔌 Plateformes connectées
          </h2>
          <div className="space-y-2">
            {[
              { platform: 'facebook'        as const, name: 'Facebook',         emoji: '👍' },
              { platform: 'instagram'       as const, name: 'Instagram',        emoji: '📷' },
              { platform: 'tiktok'          as const, name: 'TikTok',           emoji: '🎵' },
              { platform: 'google_business' as const, name: 'Google Business',  emoji: '📍' },
            ].map(p => {
              const account = socialAccounts.find(a => a.platform === p.platform)
              return (
                <div key={p.platform} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-950/40 border border-gray-800">
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-300">{p.name}</div>
                    {account?.handle && (
                      <div className="text-[10px] text-gray-500 truncate">{account.handle}</div>
                    )}
                  </div>
                  {account ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-700/40 rounded-full px-2 py-0.5">
                      ✓ Connecté
                    </span>
                  ) : (
                    <Link
                      href={`/clients/${client.id}/connections`}
                      title={`Connecter ${p.name} pour ${client.name}`}
                      className="text-xs px-2.5 py-1 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 transition-colors"
                    >
                      Connecter
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
          {socialAccounts.length === 0 && (
            <p className="text-[11px] text-gray-600 mt-3">
              Connecte un compte dans{' '}
              <Link href={`/clients/${client.id}/connections`} title="Ouvrir les connexions de ce client" className="text-purple-400 hover:underline">
                Connexions
              </Link>{' '}pour publier automatiquement.
            </p>
          )}
        </div>
      </div>

      {/* Recent activity — real posts */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">📊 Posts récents</h2>
          {clientPosts.length > 0 && (
            <Link href={`/plan?client=${client.id}`} title="Voir tous les posts de ce client dans l'historique" className="text-xs text-purple-400 hover:underline">
              Voir tout ({clientPosts.length}) →
            </Link>
          )}
        </div>
        {recentPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Pas encore de posts pour ce client.
            <div className="mt-2">
              <Link href={`/studio?client=${client.id}`} title={`Créer le premier post pour ${client.name}`} className="inline-flex items-center gap-1.5 text-purple-400 hover:underline">
                <Sparkles className="w-4 h-4" />
                Créer le premier post
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPosts.map(p => <RecentPostRow key={p.id} post={p} />)}
          </div>
        )}
      </div>

      {/* Agent jobs for this client */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            Activité agents
          </h2>
          {clientJobs.length > 0 && (
            <Link href="/agents" title="Voir l'activité globale de tous les agents IA" className="text-xs text-purple-400 hover:underline">
              Tous les jobs →
            </Link>
          )}
        </div>
        {clientJobs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucun job agent pour ce client.
          </p>
        ) : (
          <div className="space-y-2">
            {clientJobs.map(j => <AgentJobRow key={j.id} job={j} />)}
          </div>
        )}
      </div>
    </div>
  )
}

const POST_STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft:     { label: 'Brouillon', icon: Clock,         color: 'text-amber-400' },
  ready:     { label: 'Prêt',      icon: Sparkles,      color: 'text-purple-400' },
  scheduled: { label: 'Planifié',  icon: CalendarDays,  color: 'text-blue-400' },
  published: { label: 'Publié',    icon: CheckCircle2,  color: 'text-emerald-400' },
  failed:    { label: 'Échec',     icon: AlertCircle,   color: 'text-red-400' },
}

function StartupStep({ done, label, detail, href }: { done: boolean; label: string; detail: string; href: string }) {
  return (
    <Link
      href={href}
      title={`${done ? 'Étape terminée' : 'Étape à terminer'} : ${label} — ${detail}`}
      className={`rounded-xl border p-3 transition-colors ${
        done
          ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-600/60'
          : 'bg-gray-950/40 border-gray-800 hover:border-purple-700/50'
      }`}
    >
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Clock className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <div className={`text-[11px] mt-1 ${done ? 'text-emerald-300/80' : 'text-gray-500'}`}>
        {done ? '✅' : '⬜'} {detail}
      </div>
    </Link>
  )
}

function RecentPostRow({ post }: { post: Post }) {
  const cfg = POST_STATUS_CFG[post.status] ?? POST_STATUS_CFG.draft
  const Icon = cfg.icon
  const when = new Date(post.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  return (
    <Link
      href={`/validation#${post.id}`}
      title="Ouvrir ce post récent dans la file de validation"
      className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-950/40 border border-gray-800 hover:border-purple-700/40 transition-colors"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{post.brief || post.caption.substring(0, 60)}</div>
        <div className="text-[10px] text-gray-500">{post.platforms.join(' + ')} · {when}</div>
      </div>
      <span className={`text-[10px] flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
    </Link>
  )
}

const JOB_STATUS_CFG = {
  running:             { label: 'En cours',          dot: 'bg-purple-400 animate-pulse', color: 'text-purple-300' },
  completed:           { label: 'Terminé',            dot: 'bg-emerald-400',              color: 'text-emerald-300' },
  failed:              { label: 'Erreur',             dot: 'bg-red-400',                  color: 'text-red-300' },
  awaiting_validation: { label: 'Validation requise', dot: 'bg-amber-400 animate-pulse',  color: 'text-amber-300' },
}

function AgentJobRow({ job }: { job: AgentJob }) {
  const cfg = JOB_STATUS_CFG[job.status]
  const when = new Date(job.startedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <Link
      href={`/agents/jobs/${job.id}`}
      title="Voir le détail de ce travail agent"
      className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-950/40 border border-gray-800 hover:border-purple-700/40 transition-colors"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{job.briefSummary ?? 'Job'}</div>
        <div className="text-[10px] text-gray-500">{when}</div>
      </div>
      <span className={`text-[10px] flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
    </Link>
  )
}
