'use client'
import { Sparkles, Loader2, AlertCircle, RefreshCw, Target } from 'lucide-react'
import type { Post } from '@/types/post'
import { PostActions, PostSupervisor } from '@/components/posts/PostActions'
import type { ContentType, GenerationResult } from '@/lib/studio/types'
import type { Client } from '@/types/client'
import { CaptionResult } from './CaptionResult'

interface StudioResultPanelProps {
  result: GenerationResult | null
  error: string | null
  isPending: boolean
  selectedClient: Client | undefined
  clientId: string
  ctaType: string
  ctaUrl: string
  regenInstruction: string
  onRegenInstructionChange: (value: string) => void
  onRegenerateText: () => void
  onRegenerateAll: () => void
  onPostUpdated: (post: Post) => void
}

export function StudioResultPanel({
  result,
  error,
  isPending,
  selectedClient,
  clientId,
  ctaType,
  ctaUrl,
  regenInstruction,
  onRegenInstructionChange,
  onRegenerateText,
  onRegenerateAll,
  onPostUpdated,
}: StudioResultPanelProps) {
  return (
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
                  💡 Ajoute ta clé Anthropic dans <code className="bg-gray-800 px-1 rounded">.env.local</code> ou via{' '}
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
                  <video src={result.post.imageUrl} controls className="w-full max-h-[520px] object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.post.imageUrl} alt="Visuel généré" loading="lazy" decoding="async" className="w-full max-h-[520px] object-contain" />
                )}
              </div>
            )}

            {!result.post.imageUrl && (
              <div className="bg-amber-950/20 border-t border-amber-800/40 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-amber-200">Visuel non généré</div>
                  <p className="text-xs text-amber-100/80 mt-1">
                    {result.imageError || "Le post a été créé, mais aucun visuel exploitable n'a été retourné."}
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
                    <span key={pillar} className="text-[11px] px-2 py-1 rounded-md bg-amber-900/30 border border-amber-700/30 text-amber-200">
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
          {result.captions.map(c => (
            <CaptionResult
              key={`${result.post.id}-${c.platform}`}
              postId={result.post.id}
              caption={c}
              clientEmoji={selectedClient?.emoji || '🏢'}
              clientName={selectedClient?.name || ''}
              imageUrl={result.post.imageUrl}
              contentType={result.post.contentType as ContentType}
              ctaType={result.post.ctaType || ctaType}
              ctaUrl={result.post.ctaUrl || ctaUrl}
              onPostUpdated={onPostUpdated}
            />
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

            <div className="space-y-2 pt-2 border-t border-gray-800">
              <input
                type="text"
                value={regenInstruction}
                onChange={e => onRegenInstructionChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !isPending) onRegenerateText() }}
                placeholder="Précise ta demande (optionnel) — ex : plus court, sans emoji, mentionner la terrasse…"
                className="w-full px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 placeholder:text-gray-600 focus:border-blue-700 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onRegenerateText}
                  disabled={isPending}
                  title="Régénérer uniquement la caption, les hooks, CTA et hashtags sans toucher à l'image"
                  className="flex items-center gap-1 text-blue-300 hover:underline text-xs disabled:opacity-40"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Régénérer le texte uniquement
                </button>
                <button
                  onClick={onRegenerateAll}
                  disabled={isPending}
                  title="Relancer la génération complète (texte + image) avec le même brief"
                  className="flex items-center gap-1 text-purple-400 hover:underline text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tout régénérer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
