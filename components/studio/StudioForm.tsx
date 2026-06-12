'use client'
import { useState, useEffect, useTransition } from 'react'
import { Sparkles, Loader2, AlertCircle, RefreshCw, Copy, Check, Heart, MessageCircle, Send, Bookmark, Target, ImageIcon, Wand2, BrainCircuit, ChevronDown, Film } from 'lucide-react'
import type { Client } from '@/types/client'
import type { Post, SupervisorReview } from '@/types/post'
import type { ClientAsset } from '@/types/asset'
import { PostIdeasPanel } from '@/components/studio/PostIdeasPanel'
import { PostActions, PostSupervisor } from '@/components/posts/PostActions'
import type { PostIdea } from '@/lib/agents/planner'
import type { AccountDirective } from '@/lib/agents/account-director'

// ─── Brief templates ──────────────────────────────────────────────────────────

const BRIEF_TEMPLATES: Record<string, { label: string; text: string }[]> = {
  '☀️ Quotidien': [
    { label: '🍽 Plat du jour', text: 'Mettre en avant le plat du jour — ingrédients frais de saison, provenance locale, présentation soignée. Ton appétissant et accessible, donner envie de venir déjeuner.' },
    { label: '☕ Brunch / Petit-déj', text: 'Promouvoir notre formule petit-déjeuner ou brunch. Mettre en avant la générosité des portions, les produits artisanaux, l\'ambiance cosy du matin. CTA : réservation ou passage direct.' },
    { label: '🌙 Ambiance soirée', text: 'Capturer l\'ambiance de la salle en soirée — lumières tamisées, conversations animées, tables dressées. Mettre en avant l\'expérience émotionnelle et l\'invitation à partager un moment.' },
    { label: '👨‍🍳 Le geste du chef', text: 'Montrer un tour de main du chef : technique, dressage, finition d\'un plat. Texte court, vocabulaire culinaire précis, humaniser l\'équipe en cuisine.' },
  ],
  '🎉 Événement': [
    { label: '📣 Soirée spéciale', text: 'Annoncer une soirée événement à venir. Créer de l\'anticipation, mettre en avant ce qui la rend unique (animation, menu spécial, partenaire). CTA fort : lien de réservation ou DM.' },
    { label: '💌 Saint-Valentin', text: 'Menu dîner Saint-Valentin — ambiance romantique, décoration florale, menu dégustation en duo. Mettre en avant l\'intimité et le soin apporté à chaque détail. Réservations limitées.' },
    { label: '🎄 Fêtes de fin d\'année', text: 'Offres Noël / Réveillon — repas de fête, formules groupe, privatisation possible. Ton festif et chaleureux. Mettre en avant l\'accueil des familles et l\'ambiance chaleureuse.' },
    { label: '🍷 Soirée dégustation', text: 'Soirée dégustation vins ou cocktails signature. Décrire le format (accord mets-vins, blind tasting), les intervenants, le nombre de places limité. Créer l\'exclusivité.' },
  ],
  '🆕 Nouveautés': [
    { label: '🍴 Nouveau plat carte', text: 'Présenter un nouveau plat venant d\'intégrer la carte. Inspiration du chef, ingrédients phares, technique de cuisson, accord conseillé. Inviter à venir le découvrir.' },
    { label: '🍹 Nouveau cocktail', text: 'Lancer un nouveau cocktail ou mocktail de saison. Décrire les notes aromatiques, la couleur, le nom évocateur. Mettre en avant la créativité du bar.' },
    { label: '🏆 Presse / Récompense', text: 'Partager une belle critique presse, guide ou récompense reçue. Ton humble et reconnaissant, mettre en avant l\'équipe. Remercier les clients qui rendent ça possible.' },
    { label: '🔄 Retour saisonnier', text: 'Annoncer le retour d\'un plat ou produit saisonnier très attendu. Jouer sur la nostalgie et l\'anticipation. Court, percutant, émotionnel.' },
  ],
  '🤝 Humain': [
    { label: '👤 Portrait équipe', text: 'Portrait d\'un membre de l\'équipe — leur parcours, leur passion, leur rôle. Humaniser la marque, montrer les visages derrière l\'expérience. Style interview ou citation.' },
    { label: '🎂 Anniversaire / Fidélité', text: 'Célébrer un anniversaire d\'établissement ou remercier la communauté de clients fidèles. Ton chaleureux, partager une anecdote ou un chiffre marquant. Offrir quelque chose symbolique.' },
    { label: '🌿 Engagements / Valeurs', text: 'Mettre en avant un engagement fort : circuit court, producteurs locaux, zéro gâchis, démarche éco-responsable. Concret, avec des exemples chiffrés ou des noms de partenaires.' },
  ],
}

type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
type ContentType = 'photo' | 'reel' | 'story'

interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  cta: string
  characterCount: number
}

interface GenerationResult {
  post: Post
  reasoning: string
  captions: GeneratedCaption[]
  cost: number
  tokensUsed: number
  model: string
  review?: SupervisorReview
  directive?: AccountDirective
  imageError?: string
}

const PLATFORM_INFO: Record<Platform, { label: string; emoji: string; color: string }> = {
  instagram: { label: 'Instagram', emoji: '📷', color: 'bg-pink-600/20 border-pink-600/40 text-pink-300' },
  facebook:  { label: 'Facebook',  emoji: '👍', color: 'bg-blue-600/20 border-blue-600/40 text-blue-300' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', color: 'bg-purple-600/20 border-purple-600/40 text-purple-300' },
  linkedin:  { label: 'LinkedIn',  emoji: '💼', color: 'bg-sky-600/20 border-sky-600/40 text-sky-300' },
}

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; title: string; note: string }> = {
  photo: {
    label: '📸 Publication',
    title: 'Publier dans le feed Instagram et/ou Facebook avec image + caption',
    note: 'Format standard : feed Instagram + post Facebook.',
  },
  story: {
    label: '📖 Story',
    title: 'Publier en Story Instagram avec une image publique',
    note: 'Sur Instagram, la Story publie le visuel. La caption reste dans CODEXRS pour validation.',
  },
  reel: {
    label: '🎬 Reel',
    title: 'Préparer un Reel vidéo. La publication automatique nécessite une vidéo publique liée au post.',
    note: 'Publie un Reel Instagram à partir d’une vidéo publique sélectionnée dans la Library.',
  },
}

export function StudioForm({
  clients,
  initialClientId,
  initialPost,
  initialPillar,
}: {
  clients: Client[]
  initialClientId?: string
  initialPost?: Post
  initialPillar?: string
}) {
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '')
  const [brief, setBrief] = useState(
    initialPost?.brief || (initialPillar ? `Créer un post autour du pilier : ${initialPillar}` : '')
  )
  const [visualPrompt, setVisualPrompt] = useState(initialPost?.imagePrompt || '')
  const [platforms, setPlatforms] = useState<Platform[]>(
    initialPost?.platforms.filter((p): p is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)) ?? ['instagram']
  )
  const initialContentType = initialPost?.contentType ?? 'photo'
  const [contentType, setContentType] = useState<ContentType>(initialContentType)

  const [result, setResult] = useState<GenerationResult | null>(
    initialPost ? createLoadedPostResult(initialPost) : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [imageMode, setImageMode] = useState<'generate' | 'library'>(initialContentType === 'reel' ? 'library' : 'generate')
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null)
  const [clientAssets, setClientAssets] = useState<ClientAsset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const [aiDirective, setAiDirective] = useState<AccountDirective | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<string | null>(null)

  const [ctaType, setCtaType] = useState<string>('')
  const [ctaUrl, setCtaUrl] = useState<string>('')

  const selectedClient = clients.find(c => c.id === clientId)

  useEffect(() => {
    if (!clientId || imageMode !== 'library') return
    let cancelled = false
    fetch(`/api/clients/${clientId}/assets`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const assets = Array.isArray(d.assets) ? d.assets as ClientAsset[] : []
        setClientAssets(assets.filter(a => contentType === 'reel' ? a.type === 'video' : a.type === 'image' || a.type === 'logo'))
      })
      .catch(() => { if (!cancelled) setClientAssets([]) })
      .finally(() => { if (!cancelled) setAssetsLoading(false) })
    return () => { cancelled = true }
  }, [clientId, imageMode, contentType])

  function applyIdea(idea: PostIdea) {
    setBrief(idea.brief)
    const valid: Platform[] = idea.platforms.filter((p): p is Platform =>
      ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)
    )
    if (valid.length > 0) setPlatforms(valid)
  }

  async function handleSuggestBrief() {
    if (!clientId) return
    setAiLoading(true)
    setAiDirective(null)
    try {
      const res = await fetch(`/api/studio/suggest-brief?clientId=${clientId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiDirective(data.directive)
      setBrief(data.directive.enrichedBrief)
    } catch (err) {
      console.error('suggest-brief error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const selectContentType = (type: ContentType) => {
    setContentType(type)
    setSelectedAsset(null)
    if (type === 'reel') {
      setImageMode('library')
      if (clientId) setAssetsLoading(true)
    }
  }

  const handleGenerate = () => {
    setError(null)
    setResult(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/studio/generate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            brief,
            platforms,
            contentType,
            visualPrompt: visualPrompt || undefined,
            imageAssetId: imageMode === 'library' && selectedAsset ? selectedAsset.id : undefined,
            imageAssetUrl: imageMode === 'library' && selectedAsset ? selectedAsset.url : undefined,
            ctaType: ctaType || undefined,
            ctaUrl: ctaUrl || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur génération')
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Inputs */}
      <div className="col-span-1 lg:col-span-5 space-y-4">
        {/* Client selector */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">👤 Client</label>
          <select
            value={clientId}
            onChange={e => {
              setClientId(e.target.value)
              setSelectedAsset(null)
              if (imageMode === 'library') setAssetsLoading(true)
            }}
            title="Choisir le client dont la stratégie, la DA et les connexions seront utilisées pour générer le post"
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name} · {c.city || '—'}
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="mt-3 p-3 rounded-lg bg-purple-950/30 border border-purple-700/30 text-xs">
              <div className="text-purple-300 font-medium mb-1">Voix de marque chargée :</div>
              <div className="text-gray-300">{selectedClient.brandVoiceTone || 'Non définie'}</div>
            </div>
          )}

          {initialPost && (
            <div className="mt-3 p-3 rounded-lg bg-blue-950/30 border border-blue-700/30 text-xs">
              <div className="text-blue-300 font-medium mb-1">Draft chargé depuis la validation</div>
              <div className="text-gray-300">Post #{initialPost.id} · {initialPost.status}</div>
            </div>
          )}
        </div>

        {/* Strategy Director — post ideas */}
        <PostIdeasPanel clientId={clientId || null} onPick={applyIdea} />

        {/* Brief */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">✍️ Ordre pour le post</label>
            <button
              type="button"
              onClick={handleSuggestBrief}
              disabled={!clientId || aiLoading}
              title="Demander à l'Account Director de proposer un brief aligné avec la stratégie du client"
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:bg-purple-800/40 hover:border-purple-500/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-wide"
            >
              {aiLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyse en cours...</>
                : <><BrainCircuit className="w-3 h-3" /> Brief IA</>
              }
            </button>
          </div>

          {aiDirective && (
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] tracking-wider">
                <BrainCircuit className="w-3 h-3" />
                Account Director — {aiDirective.priorityPillar}
              </div>
              <p className="text-gray-300">{aiDirective.rationale}</p>
              <p className="text-amber-300/80">Hook : &ldquo;{aiDirective.hookSuggestion}&rdquo;</p>
            </div>
          )}

          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={4}
            placeholder="Décrivez exactement ce que vous voulez obtenir…&#10;&#10;Ex: Faire venir les voyageurs à Koh Samui ce week-end, angle calme tropical + réservation directe, ton premium mais humain."
            title="Ordre donné aux agents texte/stratégie : objectif commercial, angle marketing, offre, ambiance, événement ou consigne précise"
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
          />

          {/* Template categories */}
          <div className="space-y-2">
            <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">Templates rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(BRIEF_TEMPLATES).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateCategory(templateCategory === cat ? null : cat)}
                  title={`Afficher les modèles rapides pour ${cat}`}
                  className={`text-[10px] px-2.5 py-1 rounded-md border font-mono tracking-wide transition-all flex items-center gap-1 ${
                    templateCategory === cat
                      ? 'bg-indigo-900/50 border-indigo-600/60 text-indigo-200'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
                  }`}
                >
                  {cat}
                  <ChevronDown className={`w-3 h-3 transition-transform ${templateCategory === cat ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>

            {templateCategory && (
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {BRIEF_TEMPLATES[templateCategory].map(tpl => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => { setBrief(tpl.text); setTemplateCategory(null) }}
                    title={`Utiliser ce modèle de brief : ${tpl.label}`}
                    className="text-left text-xs px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-gray-300 hover:border-purple-600/50 hover:bg-purple-950/20 hover:text-purple-200 transition-all"
                  >
                    <span className="font-medium">{tpl.label}</span>
                    <span className="text-gray-500 ml-2 line-clamp-1">{tpl.text.slice(0, 60)}…</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">🎯 Plateformes cibles</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PLATFORM_INFO) as Platform[]).map(p => {
              const cfg = PLATFORM_INFO[p]
              const active = platforms.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  title={`${active ? 'Retirer' : 'Ajouter'} ${cfg.label} comme plateforme cible du post`}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                    active
                      ? cfg.color
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content type */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">📦 Format Instagram</label>
          <div className="grid grid-cols-3 gap-2">
            {(['photo', 'story', 'reel'] as ContentType[]).map(t => {
              const info = CONTENT_TYPE_INFO[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectContentType(t)}
                  title={info.title}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    contentType === t
                      ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {info.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">{CONTENT_TYPE_INFO[contentType].note}</p>
        </div>

        {/* Image mode */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">🖼️ Visuel du post</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              disabled={contentType === 'reel'}
              onClick={() => {
                setImageMode('generate')
                setSelectedAsset(null)
              }}
              title={contentType === 'reel' ? 'Un Reel Instagram nécessite une vidéo depuis la Library' : "Créer un nouveau visuel avec l'IA à partir de la stratégie et de la direction artistique du client"}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                imageMode === 'generate'
                  ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Wand2 className="w-4 h-4" />
              Générer une image
            </button>
            <button
              type="button"
              onClick={() => {
                setImageMode('library')
                setSelectedAsset(null)
                setAssetsLoading(true)
              }}
              title={contentType === 'reel' ? 'Utiliser une vidéo réelle ou générée depuis la Library du client' : 'Utiliser une photo, un logo ou une ressource réelle déjà ajoutée dans la Library du client'}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                imageMode === 'library'
                  ? 'bg-blue-600/20 border-blue-600/40 text-blue-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Depuis la bibliothèque
            </button>
          </div>

          {imageMode === 'generate' && (
            <div className="mb-4">
              <label htmlFor="visualPrompt" className="block text-xs text-gray-400 mb-1.5">
                Prompt image / vidéo
              </label>
              <textarea
                id="visualPrompt"
                value={visualPrompt}
                onChange={e => setVisualPrompt(e.target.value)}
                rows={3}
                placeholder="Ex: Photo réaliste verticale, piscine turquoise, terrasse tropicale, lumière golden hour, clients en arrière-plan flou, ambiance guesthouse premium à Koh Samui."
                title="Consigne précise donnée au Visual Director pour guider l'image IA ou la direction vidéo"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-y"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Ce champ guide uniquement le visuel. Le texte reste piloté par l&apos;ordre du post et la stratégie client.
              </p>
            </div>
          )}

          {imageMode === 'library' && (
            <div>
              {assetsLoading && (
                <div className="flex items-center justify-center py-6 text-gray-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                </div>
              )}
              {!assetsLoading && clientAssets.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  {contentType === 'reel' ? 'Aucune vidéo dans la bibliothèque de ce client.' : 'Aucune image dans la bibliothèque de ce client.'}{' '}
                  <a href={clientId ? `/clients/${clientId}/library` : '#'} className="text-purple-400 hover:underline">
                    Uploader des assets →
                  </a>
                </p>
              )}
              {!assetsLoading && clientAssets.length > 0 && (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {clientAssets.map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAsset(prev => prev?.id === asset.id ? null : asset)}
                      title={`Sélectionner ${asset.originalName} comme ${asset.type === 'video' ? 'vidéo Instagram Reel' : 'base visuelle du post'}`}
                      className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                        selectedAsset?.id === asset.id
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      {asset.type === 'video' ? (
                        <div className="relative h-full w-full bg-black">
                          <video src={asset.url} preload="metadata" className="h-full w-full object-cover opacity-80" />
                          <Film className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.thumbnailUrl ?? asset.url}
                          alt={asset.originalName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {selectedAsset?.id === asset.id && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedAsset && (
                <p className="text-xs text-blue-400 mt-2 truncate">
                  ✓ Sélectionné : {selectedAsset.originalName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* CTA Button (Facebook) */}
        {platforms.includes('facebook') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-indigo-600/60 font-mono tracking-[0.2em] uppercase">{'// CTA FACEBOOK'}</span>
              <span className="text-[8px] text-gray-600 font-mono">— bouton d&apos;action sur la publication</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={ctaType}
                onChange={e => setCtaType(e.target.value)}
                className="col-span-2 sm:col-span-1 bg-gray-900/60 border border-gray-800 text-xs text-gray-300 px-2 py-2 font-mono focus:outline-none focus:border-indigo-600"
              >
                <option value="">Aucun bouton CTA</option>
                <option value="BOOK_TRAVEL">📅 Réserver</option>
                <option value="LEARN_MORE">👉 En savoir plus</option>
                <option value="CONTACT_US">📞 Nous contacter</option>
                <option value="SHOP_NOW">🛒 Commander</option>
                <option value="GET_OFFER">🎁 Voir l&apos;offre</option>
                <option value="SIGN_UP">✍️ S&apos;inscrire</option>
                <option value="CALL_NOW">📱 Appeler</option>
              </select>
              {ctaType && (
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={e => setCtaUrl(e.target.value)}
                  placeholder="https://votre-site.com/reserver"
                  className="col-span-2 bg-gray-900/60 border border-gray-800 text-xs text-gray-300 px-2 py-2 font-mono placeholder:text-gray-700 focus:outline-none focus:border-indigo-600"
                />
              )}
            </div>
            {ctaType && !ctaUrl && (
              <p className="text-[9px] text-amber-500/70 font-mono">⚠ Entrez l&apos;URL de destination pour activer le bouton</p>
            )}
            {ctaType && ctaUrl && (
              <p className="text-[9px] text-emerald-500/60 font-mono">✓ Bouton &ldquo;{
                { BOOK_TRAVEL:'Réserver', LEARN_MORE:'En savoir plus', CONTACT_US:'Nous contacter',
                  SHOP_NOW:'Commander', GET_OFFER:"Voir l'offre", SIGN_UP:"S'inscrire", CALL_NOW:'Appeler' }[ctaType]
              }&rdquo; activé → {ctaUrl.length > 40 ? ctaUrl.substring(0, 40) + '…' : ctaUrl}</p>
            )}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!clientId || platforms.length === 0 || isPending || (imageMode === 'library' && !selectedAsset) || (contentType === 'reel' && selectedAsset?.type !== 'video')}
          title="Lancer la chaîne d'agents : analyse client, stratégie, rédaction, visuel, scoring puis draft prêt à valider"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Création du post complet...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Générer post complet
            </>
          )}
        </button>

        <div className="text-center text-[11px] text-gray-500">
          Powered by <span className="text-purple-400">Social Expert</span> · Claude Sonnet 4.6
        </div>

        <AgentWorkPlan
          selectedClient={selectedClient}
          brief={brief}
          visualPrompt={visualPrompt}
          platforms={platforms}
          contentType={contentType}
          imageMode={imageMode}
          selectedAsset={selectedAsset}
          result={result}
        />
      </div>

      {/* RIGHT: Result */}
      <div className="col-span-1 lg:col-span-7">
        {!result && !error && !isPending && (
          <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">
              Configurez votre brief puis cliquez sur <strong>Générer</strong>.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              L&apos;agent Social Expert va analyser le contexte client et créer du contenu optimisé.
            </p>
          </div>
        )}

        {isPending && (
          <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-spin" />
            <p className="text-white font-medium">L&apos;agent réfléchit...</p>
            <div className="mt-4 space-y-1 text-xs text-gray-400">
              <p>→ Chargement du contexte client</p>
              <p>→ Application de la voix de marque et de la DA</p>
              <p>→ Génération texte + image</p>
              <p>→ Scoring d&apos;impact</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-700/40 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-300">Erreur de génération</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>
                {error.includes('ANTHROPIC_API_KEY') && (
                  <p className="text-xs text-gray-400 mt-3">
                    💡 Ajoute ta clé Anthropic dans le fichier <code className="bg-gray-800 px-1 rounded">.env.local</code> ou via la page{' '}
                    <a href="/social/settings/connections" className="text-purple-400 hover:underline">Connexions</a>.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Generated post visual */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-400">Post complet généré</div>
                  <div className="text-sm text-gray-400">Draft #{result.post.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-300">{result.post.impactScore}/100</div>
                  <div className="text-[11px] text-gray-500">score impact</div>
                </div>
              </div>

              {result.post.imageUrl && (
                <div className="bg-black">
                  {result.post.contentType === 'reel' ? (
                    <video
                      src={result.post.imageUrl}
                      controls
                      className="w-full max-h-[520px] object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.post.imageUrl}
                      alt="Visuel généré"
                      loading="lazy"
                      decoding="async"
                      className="w-full max-h-[520px] object-contain"
                    />
                  )}
                </div>
              )}

              {!result.post.imageUrl && (
                <div className="bg-amber-950/20 border-t border-amber-800/40 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-200">Visuel non généré</div>
                    <p className="text-xs text-amber-100/80 mt-1">
                      {result.imageError || 'Le post a été créé, mais aucun visuel exploitable n’a été retourné.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-800 text-sm text-gray-300">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Analyse impact</div>
                {result.post.impactAnalysis}
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-purple-400 mb-1">💡 Stratégie</div>
              <p className="text-sm text-gray-300">{result.reasoning}</p>
            </div>

            {result.directive && (
              <div className="bg-amber-950/20 border border-amber-700/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-400">
                  <Target className="w-4 h-4" />
                  <span>Account Director — Pilier prioritaire : {result.directive.priorityPillar}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><span className="text-amber-300">Rationale :</span> {result.directive.rationale}</p>
                  <p><span className="text-amber-300">Hook proposé :</span> &ldquo;{result.directive.hookSuggestion}&rdquo;</p>
                  <p><span className="text-amber-300">CTA proposé :</span> {result.directive.ctaSuggestion}</p>
                </div>
                {result.directive.recentPillarsCovered.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.directive.recentPillarsCovered.map(pillar => (
                      <span
                        key={pillar}
                        className="text-[11px] px-2 py-1 rounded-md bg-amber-900/30 border border-amber-700/30 text-amber-200"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.post.imagePrompt && (
              <div className="bg-blue-950/20 border border-blue-700/30 rounded-2xl p-4">
                <div className="text-[11px] uppercase tracking-wider text-blue-300 mb-1">Visual Director — prompt utilisé</div>
                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{result.post.imagePrompt}</p>
              </div>
            )}

            {/* Captions per platform */}
            {result.captions.map((c, i) => (
              <CaptionResult key={i} caption={c} clientEmoji={selectedClient?.emoji || '🏢'} clientName={selectedClient?.name || ''} />
            ))}

            {/* Cost footer */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Tokens utilisés : <span className="text-purple-400">{result.tokensUsed.toLocaleString()}</span></span>
                <span>Coût estimé : <span className="text-purple-400">${result.cost.toFixed(4)}</span></span>
                <span>Status : <span className="text-emerald-400">{result.post.status}</span></span>
              </div>

              {clientId && (
                <div className="flex justify-end">
                  <a
                    href={`/clients/${clientId}/connections`}
                    title="Ouvrir la page de connexion Meta pour vérifier que Facebook et Instagram peuvent publier"
                    className="text-[11px] text-blue-300 hover:underline"
                  >
                    🩺 Vérifier le token Meta du client
                  </a>
                </div>
              )}

              <PostSupervisor post={result.post} />

              <PostActions post={result.post} refresh={false} />

              <div className="flex items-center justify-end pt-2 border-t border-gray-800">
                <button
                  onClick={handleGenerate}
                  disabled={isPending}
                  title="Relancer la génération avec le même brief pour obtenir une nouvelle proposition"
                  className="flex items-center gap-1 text-purple-400 hover:underline text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Régénérer le post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function createLoadedPostResult(post: Post): GenerationResult {
  return {
    post,
    reasoning: post.reasoning ?? 'Draft existant chargé depuis la file de validation.',
    captions: post.platforms
      .filter((platform): platform is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(platform))
      .map(platform => ({
        platform,
        caption: post.caption,
        hashtags: post.hashtags,
        hook: post.hook ?? '',
        cta: post.cta ?? '',
        characterCount: post.caption.length,
      })),
    cost: post.cost,
    tokensUsed: post.tokensUsed,
    model: 'draft-existant',
    review: post.supervisorReview ?? undefined,
  }
}

function AgentWorkPlan({
  selectedClient,
  brief,
  visualPrompt,
  platforms,
  contentType,
  imageMode,
  selectedAsset,
  result,
}: {
  selectedClient?: Client
  brief: string
  visualPrompt: string
  platforms: Platform[]
  contentType: ContentType
  imageMode: 'generate' | 'library'
  selectedAsset: ClientAsset | null
  result: GenerationResult | null
}) {
  const clientLabel = selectedClient ? `${selectedClient.name}${selectedClient.city ? ` · ${selectedClient.city}` : ''}` : 'Client non sélectionné'
  const platformLabel = platforms.length ? platforms.map(p => PLATFORM_INFO[p].label).join(' + ') : 'Aucune plateforme'
  const visualTask = imageMode === 'library'
    ? selectedAsset ? `Utiliser la ressource Library : ${selectedAsset.originalName}` : 'Attendre une ressource Library'
    : visualPrompt.trim()
      ? `Créer un visuel avec cette direction : ${visualPrompt.trim()}`
      : 'Créer un visuel cohérent avec la DA et le brief'

  const steps = [
    {
      agent: 'Account Director',
      before: `Identifier ${clientLabel}, relire stratégie, historique et résumé client.`,
      after: result?.directive ? `${result.directive.priorityPillar} — ${result.directive.rationale}` : null,
    },
    {
      agent: 'Social Director',
      before: `Transformer l'ordre en texte ${platformLabel}. Brief : ${brief.trim() || 'à compléter'}`,
      after: result?.captions?.length ? `${result.captions.length} caption(s), hook principal : ${result.captions[0]?.hook || '—'}` : null,
    },
    {
      agent: 'Visual Director',
      before: `${visualTask}. Format demandé : ${CONTENT_TYPE_INFO[contentType].label}.`,
      after: result?.post.imageUrl
        ? 'Visuel prêt et attaché au draft.'
        : result?.imageError
          ? `Échec visuel : ${result.imageError}`
          : null,
    },
    {
      agent: 'Impact Reviewer',
      before: 'Contrôler hook, CTA, cohérence DA, score impact et risques avant validation.',
      after: result ? `Score ${result.post.impactScore}/100${result.review ? ` · verdict ${result.review.verdict}` : ''}` : null,
    },
    {
      agent: 'Publisher',
      before: 'Laisser en validation avant publication automatique Facebook/Instagram.',
      after: result ? `Draft ${result.post.status} créé : #${result.post.id}` : null,
    },
  ]

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white">🧠 Préparation des agents</h3>
        <p className="text-xs text-gray-500 mt-1">
          Ce panneau montre ce que chaque agent s&apos;apprête à faire, puis son résultat après génération.
        </p>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.agent} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="text-xs font-semibold text-purple-200">
                {index + 1}. {step.agent}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                step.after
                  ? step.after.startsWith('Échec')
                    ? 'border-amber-700/50 text-amber-300 bg-amber-950/20'
                    : 'border-emerald-700/50 text-emerald-300 bg-emerald-950/20'
                  : 'border-gray-700 text-gray-500 bg-gray-900/50'
              }`}>
                {step.after ? 'Résultat' : 'Prévu'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{step.after || step.before}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Caption Result Component ─────────────────────────────────────────────────

function CaptionResult({ caption, clientEmoji, clientName }: { caption: GeneratedCaption; clientEmoji: string; clientName: string }) {
  const [copied, setCopied] = useState(false)
  const cfg = PLATFORM_INFO[caption.platform]

  const handleCopy = () => {
    const fullText = caption.caption + '\n\n' + caption.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 border-b border-gray-800 flex items-center justify-between ${cfg.color.replace('text-', 'bg-').replace('/20', '/10')}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-sm font-semibold text-white">{cfg.label}</span>
          <span className="text-[11px] text-gray-500">· {caption.characterCount} caractères</span>
        </div>
        <button
          onClick={handleCopy}
          title={`Copier le texte complet et les hashtags pour ${cfg.label}`}
          className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 flex items-center gap-1"
        >
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
        </button>
      </div>

      {/* IG-like preview if Instagram */}
      {caption.platform === 'instagram' ? (
        <div className="bg-white">
          {/* IG header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-base">
              {clientEmoji}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{clientName.toLowerCase().replace(/\s+/g, '')}</div>
            </div>
          </div>
          {/* Placeholder image */}
          <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 flex items-center justify-center text-6xl">
            {clientEmoji}
          </div>
          {/* Actions */}
          <div className="p-3 text-gray-900">
            <div className="flex items-center gap-4 mb-2">
              <Heart className="w-6 h-6" />
              <MessageCircle className="w-6 h-6" />
              <Send className="w-6 h-6" />
              <Bookmark className="w-6 h-6 ml-auto" />
            </div>
            <div className="text-sm">
              <span className="font-semibold mr-1.5">{clientName.toLowerCase().replace(/\s+/g, '')}</span>
              {caption.caption}
              <div className="text-blue-700 mt-2">
                {caption.hashtags.map((h, i) => (
                  <span key={i} className="mr-1.5">#{h.replace(/^#/, '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-3">
          <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{caption.caption}</div>
          {caption.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caption.hashtags.map((h, i) => (
                <span key={i} className="text-xs text-blue-400">#{h.replace(/^#/, '')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="px-5 py-3 border-t border-gray-800 bg-gray-950/40 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Hook :</span>{' '}
          <span className="text-purple-300 italic">&ldquo;{caption.hook}&rdquo;</span>
        </div>
        <div>
          <span className="text-gray-500">CTA :</span>{' '}
          <span className="text-emerald-300">{caption.cta}</span>
        </div>
      </div>
    </div>
  )
}
