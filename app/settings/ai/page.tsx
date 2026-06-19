import Link from 'next/link'
import { ArrowLeft, BrainCircuit, CheckCircle2, Gauge, ImageIcon, Route, ShieldCheck, Sparkles, Video, WalletCards, Zap } from 'lucide-react'
import { getAIProviderStatuses } from '@/lib/ai/providers'
import { listRoutingPreview } from '@/lib/ai/router'
import { AIProviderCard } from '@/components/settings/AIProviderCard'

export const dynamic = 'force-dynamic'

const TASK_LABELS: Record<string, string> = {
  client_strategy: 'Stratégie client',
  social_caption: 'Caption social',
  post_supervision: 'Supervision finale',
  visual_identity: 'Analyse DA',
  image_generation: 'Génération image',
  image_editing: 'Édition image',
  video_generation: 'Génération vidéo',
  performance_analysis: 'Analyse performance',
  document_summary: 'Résumé document',
  low_cost_variation: 'Variante low-cost',
}

export default function AISettingsPage() {
  const providers = getAIProviderStatuses()
  const routing = listRoutingPreview()
  const configuredCount = providers.filter(provider => provider.configured).length
  const activeProviders = providers.filter(provider => provider.status === 'active')
  const missingActive = activeProviders.filter(provider => !provider.configured)
  const textProviders = providers.filter(provider => provider.category === 'text')
  const imageProviders = providers.filter(provider => provider.category === 'image')
  const videoProviders = providers.filter(provider => provider.category === 'video')
  const localProviders = providers.filter(provider => provider.category === 'local')

  return (
    <div className="max-w-6xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" />
        Retour paramètres
      </Link>

      <header className="border-b border-indigo-950/60 pb-5">
        <div className="mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-indigo-600/50">
          <BrainCircuit className="h-3 w-3" />
          MAESTRO // AI ROUTER
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-[#E0E3FF]">IA & MODÈLES</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
              Cockpit du futur routeur IA : voir les providers connectés, les capacités disponibles, les modèles recommandés et les prochains branchements.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Connectés" value={configuredCount} />
            <MiniStat label="Actifs" value={activeProviders.length} />
            <MiniStat label="À régler" value={missingActive.length} tone={missingActive.length ? 'warn' : 'ok'} />
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Navigation IA Router">
        {[
          ['#overview', 'Vue d’ensemble'],
          ['#providers', 'Providers'],
          ['#routing', 'Routing'],
          ['#roadmap', 'Roadmap'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-gray-800 bg-gray-950/60 px-3 py-1.5 text-xs text-gray-300 transition hover:border-indigo-600/60 hover:text-indigo-200"
          >
            {label}
          </Link>
        ))}
      </nav>

      <section id="overview" className="grid gap-3 md:grid-cols-3">
        <Principle icon={ShieldCheck} title="Qualité d’abord" text="Les tâches critiques restent sur un modèle premium." />
        <Principle icon={WalletCards} title="Coût contrôlé" text="Les variantes simples pourront aller vers des modèles economy." />
        <Principle icon={Route} title="Fallback clair" text="Chaque mission doit expliquer son provider, son modèle et sa solution de secours." />
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <CapabilityLane icon={BrainCircuit} title="Texte & stratégie" providers={textProviders} />
        <CapabilityLane icon={ImageIcon} title="Image & édition" providers={imageProviders} />
        <CapabilityLane icon={Video} title="Vidéo & reels" providers={videoProviders} />
        <CapabilityLane icon={Gauge} title="Local / low-cost" providers={localProviders} />
      </section>

      <section id="providers" className="space-y-3 scroll-mt-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Providers IA</h2>
          <p className="mt-1 text-xs text-gray-500">Aucune clé n’est affichée côté interface. Maestro ne montre que configuré/non configuré.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {providers.map(provider => <AIProviderCard key={provider.id} provider={provider} />)}
        </div>
      </section>

      <section id="routing" className="space-y-3 scroll-mt-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Décisions de routing prévues</h2>
          <p className="mt-1 text-xs text-gray-500">
            Pour l’instant, ce tableau est consultatif. Les agents existants ne sont pas encore remplacés par le routeur.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/50">
          <div className="grid grid-cols-12 border-b border-gray-800 px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600">
            <div className="col-span-3">Mission</div>
            <div className="col-span-2">Provider</div>
            <div className="col-span-3">Modèle</div>
            <div className="col-span-2">Coût estimé</div>
            <div className="col-span-2">État</div>
          </div>
          {routing.map(decision => (
            <div key={decision.taskType} className="grid grid-cols-12 gap-2 border-b border-gray-900 px-4 py-3 text-xs last:border-b-0">
              <div className="col-span-3 font-medium text-white">{TASK_LABELS[decision.taskType] ?? decision.taskType}</div>
              <div className="col-span-2 text-indigo-200">{decision.providerName}</div>
              <div className="col-span-3 text-gray-300">{decision.model}</div>
              <div className="col-span-2 text-gray-400">{decision.estimatedCostUsd == null ? 'Variable' : `$${decision.estimatedCostUsd.toFixed(decision.estimatedCostUsd < 0.01 ? 4 : 2)}`}</div>
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  decision.configured
                    ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                    : 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                }`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {decision.configured ? 'Prêt' : 'À connecter'}
                </span>
              </div>
              <div className="col-span-12 text-[11px] leading-relaxed text-gray-500">{decision.reason}</div>
              {decision.warnings.length > 0 ? (
                <div className="col-span-12 text-[11px] text-amber-300">{decision.warnings.join(' ')}</div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section id="roadmap" className="space-y-3 scroll-mt-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Roadmap d’intégration</h2>
          <p className="mt-1 text-xs text-gray-500">
            Ordre recommandé pour connecter le routeur aux vrais agents sans casser le tunnel de publication.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ['1', 'Observer', 'Page IA Router visible, aucune action runtime modifiée.', true],
            ['2', 'Variantes texte', 'Router les tâches simples vers un modèle moins cher.', false],
            ['3', 'Performance', 'Laisser le routeur choisir l’analyse coût/performance.', false],
            ['4', 'Images', 'Choisir OpenAI, Replicate ou Ideogram selon besoin visuel.', false],
            ['5', 'Supervision', 'Brancher seulement quand le scoring qualité est stable.', false],
          ].map(([step, title, text, done]) => (
            <div key={String(step)} className={`rounded-2xl border p-4 ${done ? 'border-emerald-800/40 bg-emerald-950/15' : 'border-gray-800 bg-gray-950/50'}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.25em] text-gray-600">Phase {step}</span>
                {done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Zap className="h-4 w-4 text-gray-600" />}
              </div>
              <div className="text-sm font-semibold text-white">{String(title)}</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{String(text)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function MiniStat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warn' | 'ok' }) {
  const color = tone === 'warn' ? 'text-amber-300' : tone === 'ok' ? 'text-emerald-300' : 'text-white'
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/70 px-4 py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-gray-600">{label}</div>
    </div>
  )
}

function Principle({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-indigo-900/30 bg-indigo-950/15 p-4">
      <Icon className="mb-3 h-5 w-5 text-indigo-300" />
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
    </div>
  )
}

function CapabilityLane({ icon: Icon, title, providers }: { icon: typeof Sparkles; title: string; providers: ReturnType<typeof getAIProviderStatuses> }) {
  const configured = providers.filter(provider => provider.configured).length
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-indigo-300" />
          <div className="text-sm font-semibold text-white">{title}</div>
        </div>
        <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[10px] text-gray-400">
          {configured}/{providers.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {providers.map(provider => (
          <div key={provider.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-400">{provider.shortName}</span>
            <span className={provider.configured ? 'text-emerald-300' : provider.status === 'active' ? 'text-amber-300' : 'text-gray-600'}>
              {provider.configured ? 'connecté' : provider.status === 'active' ? 'à connecter' : 'prévu'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
