export function scoreImpact(input: {
  caption: string
  hashtags: string[]
  hasVisualIdentity: boolean
}) {
  let score = 55
  if (input.caption.length >= 120 && input.caption.length <= 450) score += 12
  if (input.hashtags.length >= 4 && input.hashtags.length <= 9) score += 10
  if (/[?]/.test(input.caption)) score += 5
  if (/réserv|venez|découvr|ce soir|week-end/i.test(input.caption)) score += 8
  if (input.hasVisualIdentity) score += 10
  return Math.min(score, 95)
}

export function buildImpactAnalysis(score: number, hasVisualIdentity: boolean) {
  const da = hasVisualIdentity
    ? 'La direction artistique du client a été injectée dans la génération.'
    : "Aucune direction artistique analysée n'est encore disponible pour ce client."
  return `Score prédictif ${score}/100. ${da} Le post combine hook, CTA, hashtags et visuel généré pour maximiser l'impact social.`
}
