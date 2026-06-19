import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileImage,
  Plug,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import type { Client } from '@/types/client'
import { BUSINESS_OBJECTIVES, BUSINESS_TARGET_DELAYS, CONVERSION_CHANNELS } from '@/types/client'
import type { ClientAssetSummary } from '@/lib/db/queries/assets'
import type { ClientSocialAccountSummary } from '@/lib/db/queries/social-accounts'
import type { Post } from '@/types/post'

interface ClientTestDrivePanelProps {
  client: Client
  assetSummary: ClientAssetSummary
  hasVisualIdentity: boolean
  socialAccounts: ClientSocialAccountSummary[]
  posts: Post[]
  aiReady?: boolean
  publicUrlReady?: boolean
  compact?: boolean
}

export function ClientTestDrivePanel({
  client,
  assetSummary,
  hasVisualIdentity,
  socialAccounts,
  posts,
  aiReady = false,
  publicUrlReady = false,
  compact = false,
}: ClientTestDrivePanelProps) {
  const facebookConnected = socialAccounts.some(a => a.platform === 'facebook' && a.hasAccessToken && a.accountId)
  const instagramConnected = socialAccounts.some(a => a.platform === 'instagram' && a.hasAccessToken && a.accountId)
  const metaReady = facebookConnected && instagramConnected
  const hasBusinessProfile = Boolean(client.businessProfile)
  const hasStrategy = Boolean(client.strategy?.contentPillars?.length)
  const hasResources = assetSummary.images > 0 || assetSummary.videos > 0 || assetSummary.logos > 0
  const hasDraft = posts.some(p => p.status === 'draft' || p.status === 'ready' || p.status === 'failed')
  const hasReady = posts.some(p => p.status === 'ready')
  const hasScheduled = posts.some(p => p.status === 'scheduled')
  const hasPublished = posts.some(p => p.status === 'published')

  const steps = [
    {
      icon: Target,
      label: 'Profil business',
      detail: hasBusinessProfile ? businessSummary(client) : 'Verticale, objectif, offres et conversion à renseigner.',
      done: hasBusinessProfile && hasStrategy,
      href: hasBusinessProfile ? `/clients/${client.id}` : `/clients/${client.id}/edit`,
      action: hasBusinessProfile ? 'Voir' : 'Compléter',
    },
    {
      icon: FileImage,
      label: 'Library + DA',
      detail: hasVisualIdentity
        ? `${assetSummary.total} ressource(s), DA active.`
        : hasResources
          ? `${assetSummary.total} ressource(s), analyse DA à lancer.`
          : 'Ajouter photos, vidéos, logo et charte graphique.',
      done: hasResources && hasVisualIdentity,
      href: `/clients/${client.id}/library`,
      action: hasVisualIdentity ? 'Gérer' : 'Préparer',
    },
    {
      icon: Plug,
      label: 'Connexions',
      detail: metaReady
        ? 'Facebook + Instagram prêts pour publication.'
        : facebookConnected
          ? 'Facebook prêt, Instagram à finaliser.'
          : 'Connecter Meta avant le test publication.',
      done: Boolean(aiReady && publicUrlReady && metaReady),
      href: `/clients/${client.id}/connections`,
      action: metaReady ? 'Diagnostiquer' : 'Connecter',
    },
    {
      icon: Sparkles,
      label: 'Post complet',
      detail: hasDraft || hasReady || hasScheduled || hasPublished
        ? 'Un contenu existe déjà pour ce client.'
        : 'Créer texte, visuel, CTA et score impact.',
      done: hasDraft || hasReady || hasScheduled || hasPublished,
      href: `/studio?client=${client.id}`,
      action: 'Créer',
    },
    {
      icon: ShieldCheck,
      label: 'Validation',
      detail: hasReady || hasScheduled || hasPublished
        ? 'Au moins un post est prêt ou déjà validé.'
        : 'Relire, modifier puis marquer prêt.',
      done: hasReady || hasScheduled || hasPublished,
      href: `/validation?client=${client.id}`,
      action: 'Valider',
    },
    {
      icon: CalendarDays,
      label: 'Planification',
      detail: hasPublished ? 'Premier post publié.' : hasScheduled ? 'Premier post planifié.' : 'Planifier ou publier le premier post.',
      done: hasScheduled || hasPublished,
      href: `/plan?client=${client.id}`,
      action: hasPublished ? 'Voir' : 'Planifier',
    },
  ]

  const doneCount = steps.filter(step => step.done).length
  const nextStep = steps.find(step => !step.done)
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <section className={`border border-indigo-800/30 bg-gradient-to-br from-gray-950 via-slate-950 to-indigo-950/30 ${compact ? 'rounded-2xl p-5' : 'rounded-[1.25rem] p-6'}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-indigo-300/70">
            <Rocket className="h-3.5 w-3.5" />
            Test client A-Z
          </div>
          <h2 className="text-xl font-semibold tracking-wide text-white">
            {doneCount === steps.length ? 'Tunnel prêt pour démonstration' : nextStep ? `Prochaine action : ${nextStep.label}` : 'Tunnel client'}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
            {nextStep
              ? `${nextStep.detail} L'objectif est d'aller jusqu'à un post validé puis planifié ou publié.`
              : 'Le client dispose du minimum opérationnel pour tester le flux complet de création, validation et publication.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{pct}%</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{doneCount}/{steps.length} étapes</div>
          </div>
          <Link
            href={nextStep?.href ?? `/studio?client=${client.id}`}
            title={nextStep ? `${nextStep.action} : ${nextStep.label}` : 'Créer un nouveau post'}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-indigo-100"
          >
            {nextStep?.action ?? 'Créer'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-800">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-fuchsia-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className={`mt-5 grid gap-2 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-6'}`}>
        {steps.map(step => {
          const Icon = step.icon
          return (
            <Link
              key={step.label}
              href={step.href}
              title={`${step.action} : ${step.label}`}
              className={`group rounded-xl border p-3 transition ${
                step.done
                  ? 'border-emerald-800/40 bg-emerald-950/20 hover:border-emerald-500/60'
                  : 'border-gray-800 bg-gray-950/50 hover:border-indigo-600/60'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Icon className={`h-4 w-4 ${step.done ? 'text-emerald-300' : 'text-indigo-300'}`} />
                {step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-gray-600" />}
              </div>
              <div className="text-sm font-medium text-white">{step.label}</div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-500">{step.detail}</div>
            </Link>
          )
        })}
      </div>

      {client.businessProfile ? (
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <BusinessPill label="Objectif" value={BUSINESS_OBJECTIVES[client.businessProfile.priorityObjective]?.label ?? client.businessProfile.priorityObjective} />
          <BusinessPill label="Délai" value={BUSINESS_TARGET_DELAYS[client.businessProfile.targetDelay]?.label ?? client.businessProfile.targetDelay} />
          <BusinessPill
            label="Conversion"
            value={client.businessProfile.conversionChannels.map(channel => CONVERSION_CHANNELS[channel]?.label ?? channel).join(', ')}
          />
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-800/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
          <BadgeCheck className="h-4 w-4" />
          Le profil business rendra les recommandations plus orientées chiffre d&apos;affaires.
        </div>
      )}
    </section>
  )
}

function BusinessPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-indigo-800/40 bg-indigo-950/30 px-2.5 py-1 text-indigo-100">
      <span className="text-indigo-400/80">{label} :</span> {value || 'à préciser'}
    </span>
  )
}

function businessSummary(client: Client): string {
  const profile = client.businessProfile
  if (!profile) return ''
  const objective = BUSINESS_OBJECTIVES[profile.priorityObjective]?.label ?? profile.priorityObjective
  const offers = profile.mainOffers.slice(0, 2).join(', ')
  return offers ? `${objective} via ${offers}.` : objective
}
