import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Circle, Sparkles, Bot, FolderOpen, Plug, Globe, FileImage } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { getClientAssetSummary, getVisualIdentity } from '@/lib/db/queries/assets'
import { listClientSocialAccountSummaries } from '@/lib/db/queries/social-accounts'
import { listPosts } from '@/lib/db/queries/posts'
import { ClientTestDrivePanel } from '@/components/clients/ClientTestDrivePanel'

export const dynamic = 'force-dynamic'

export default async function ClientSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const [assetSummary, identity, socialAccounts, posts] = await Promise.all([
    getClientAssetSummary(id),
    getVisualIdentity(id),
    listClientSocialAccountSummaries(id),
    listPosts({ clientId: id, limit: 100, includeInsights: false }),
  ])

  const hasImages = assetSummary.images > 0 || assetSummary.logos > 0
  const hasDocuments = assetSummary.documents > 0 || assetSummary.brandGuides > 0
  const hasIdentity = Boolean(identity?.stylePrompt)
  const aiReady = Boolean(process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY)
  const publicUrlReady = Boolean(
    process.env.CODEXRS_PUBLIC_URL && !/localhost|127\.0\.0\.1/.test(process.env.CODEXRS_PUBLIC_URL || '')
  )
  const fbAccount = socialAccounts.find(a => a.platform === 'facebook')
  const igAccount = socialAccounts.find(a => a.platform === 'instagram')
  const metaReady = Boolean(
    fbAccount?.hasAccessToken && fbAccount?.accountId && igAccount?.hasAccessToken && igAccount?.accountId
  )
  const hasFirstPost = posts.length > 0

  const steps: Step[] = [
    {
      icon: FolderOpen,
      title: '1. Profil & stratégie',
      done: true,
      detail: `${client.name}, ${client.city || '—'} · ${client.strategy.contentPillars.length} piliers de contenu chargés.`,
      href: `/clients/${client.id}`,
      action: 'Voir le profil',
    },
    {
      icon: FileImage,
      title: '2. Library + DA',
      done: hasImages && hasIdentity,
      detail: hasIdentity
          ? `DA synthétisée à partir de ${identity?.assetsCount || assetSummary.total} ressource(s).`
        : hasImages
          ? `${assetSummary.total} ressource(s) — clique « Analyser la DA » pour générer le style.`
          : 'Ajouter photos, logo, documents DA pour guider les agents visuels.',
      href: `/clients/${client.id}/library`,
      action: 'Gérer la library',
      sublist: [
        { label: 'Images', ok: hasImages },
        { label: 'Documents DA', ok: hasDocuments },
        { label: 'DA synthétisée', ok: hasIdentity },
      ],
    },
    {
      icon: Bot,
      title: '3. Connexions IA',
      done: aiReady,
      detail: aiReady
        ? 'Claude + OpenAI configurés — agents prêts à générer.'
        : 'Ajouter ANTHROPIC_API_KEY et OPENAI_API_KEY dans .env.local.',
      href: '/connections',
      action: aiReady ? 'Voir le guide' : 'Configurer',
      sublist: [
        { label: 'Anthropic (Claude)', ok: Boolean(process.env.ANTHROPIC_API_KEY) },
        { label: 'OpenAI (Images)', ok: Boolean(process.env.OPENAI_API_KEY) },
      ],
    },
    {
      icon: Plug,
      title: '4. Connexions Meta',
      done: metaReady,
      detail: metaReady
        ? 'Page Facebook + Instagram connectées — token actif.'
        : fbAccount
          ? 'Page Facebook connectée — Instagram reste à ajouter.'
        : 'Coller un Page Access Token pour publier sur Facebook + Instagram.',
      href: `/clients/${client.id}/connections`,
      action: metaReady ? 'Diagnostiquer' : 'Connecter Meta',
      sublist: [
        { label: 'Facebook Page', ok: Boolean(fbAccount?.hasAccessToken) },
        { label: 'Instagram Business', ok: Boolean(igAccount?.hasAccessToken) },
      ],
    },
    {
      icon: Globe,
      title: '5. URL publique',
      done: publicUrlReady,
      detail: publicUrlReady
        ? `CODEXRS_PUBLIC_URL configurée — Meta peut fetcher tes images.`
        : 'Sans URL publique, Instagram ne peut pas publier les visuels (Facebook fonctionne en text-only).',
      href: '/connections',
      action: 'Voir le guide',
    },
    {
      icon: Sparkles,
      title: '6. Premier post',
      done: hasFirstPost,
      detail: hasFirstPost
        ? `${posts.length}+ post(s) déjà créé(s).`
        : 'Générer un post → supervision Claude → validation → publication.',
      href: `/studio?client=${client.id}`,
      action: hasFirstPost ? 'Créer un nouveau post' : 'Créer le 1ᵉʳ post',
    },
  ]

  const completed = steps.filter(s => s.done).length

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href={`/clients/${client.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour au profil
      </Link>

      <div className="flex items-start gap-5 pb-6 border-b border-gray-800">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${client.color} flex items-center justify-center text-4xl shadow-lg flex-shrink-0`}>
          {client.emoji}
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-purple-400 mb-1">Tunnel d&apos;onboarding</div>
          <h1 className="text-3xl font-bold text-white">Connecter {client.name}</h1>
          <p className="text-sm text-gray-400 mt-2">
            DA, IA, Meta, URL publique, premier post — 6 étapes pour rendre la publication fiable.
          </p>
        </div>
        <Link
          href={`/studio?client=${client.id}`}
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Créer un post
        </Link>
      </div>

      <ClientTestDrivePanel
        client={client}
        assetSummary={assetSummary}
        hasVisualIdentity={hasIdentity}
        socialAccounts={socialAccounts}
        posts={posts}
        aiReady={aiReady}
        publicUrlReady={publicUrlReady}
      />

      {/* Progress hero */}
      <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-6 flex items-center gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-purple-300 mb-1">Progression</div>
          <div className="text-5xl font-bold text-white">{completed}<span className="text-2xl text-gray-500">/{steps.length}</span></div>
        </div>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-purple-200 mt-3">
            {completed === steps.length
              ? '✅ Tunnel complet — tu peux publier en confiance sur Facebook et Instagram.'
              : `${steps.length - completed} étape(s) restante(s) avant publication fiable.`}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, idx) => (
          <StepCard key={idx} step={step} />
        ))}
      </div>

      {/* Agent chain */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">🧠 Ordre de travail des agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          {[
            { num: '1', title: 'Account Director', sub: 'charge le client + DA' },
            { num: '2', title: 'Strategy Director', sub: 'pose l\'angle' },
            { num: '3', title: 'Social + Visual', sub: 'texte + image' },
            { num: '4', title: 'Claude Supervisor', sub: 'relit avant validation' },
            { num: '5', title: 'Publisher', sub: 'publie après ton OK' },
          ].map(s => (
            <div key={s.num} className="bg-gray-950/40 border border-gray-800 rounded-lg p-3">
              <div className="text-[10px] text-purple-400 mb-1">ÉTAPE {s.num}</div>
              <div className="text-sm font-medium text-white">{s.title}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Components ──────────────────────────────────────────────────────────────

interface Step {
  icon: typeof Sparkles
  title: string
  done: boolean
  detail: string
  href: string
  action: string
  sublist?: Array<{ label: string; ok: boolean }>
}

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon
  return (
    <Link
      href={step.href}
      className={`block rounded-2xl border p-5 transition-all ${
        step.done
          ? 'bg-emerald-950/20 border-emerald-700/30 hover:border-emerald-600/50'
          : 'bg-gray-900/40 border-gray-800 hover:border-purple-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          step.done ? 'bg-emerald-900/40' : 'bg-purple-900/30'
        }`}>
          <Icon className={`w-5 h-5 ${step.done ? 'text-emerald-300' : 'text-purple-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{step.title}</h3>
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 leading-snug">{step.detail}</p>

          {step.sublist && (
            <ul className="mt-2 space-y-0.5">
              {step.sublist.map(item => (
                <li key={item.label} className="text-[11px] flex items-center gap-1.5">
                  {item.ok ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  )}
                  <span className={item.ok ? 'text-gray-300' : 'text-gray-500'}>{item.label}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="text-[11px] text-purple-400 mt-3 font-medium">{step.action} →</div>
        </div>
      </div>
    </Link>
  )
}
