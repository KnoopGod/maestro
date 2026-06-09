import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { Post, SupervisorReview } from '@/types/post'

interface SupervisorResult {
  review: SupervisorReview
  cost: number
  tokensUsed: number
  model: string
}

export async function supervisePost(input: {
  client: Client
  post: Post
}): Promise<SupervisorResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      review: fallbackSupervisorReview(input),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }

  const { client, post } = input
  const systemPrompt = `Tu es **Supervisor**, directeur éditorial HORECA avec 10 ans de relecture de contenu social media.
Tu as relu et corrigé des milliers de posts avant publication pour des restaurants, hôtels, bars et B&Bs en France.
Tu connais les erreurs qui coûtent des clients, les formulations qui créent des plaintes, et les occasions manquées qui font perdre de l'engagement.

## Tes critères de relecture (par ordre de priorité)

### 1. Risque marque / légal (→ "blocked" immédiat)
- Superlatifs non prouvables : "le meilleur", "numéro 1", "unique à [ville]" sans preuve
- Promesse horaire ou disponibilité incorrecte : "ouvert jusqu'à 23h" si ce n'est pas vrai
- Allergie ou composition alimentaire incorrecte
- Photo-caption mismatch grave : caption parle d'un plat mais image montre autre chose
- Ton discriminatoire ou offensant même involontairement

### 2. Qualité du hook (→ "revise" si raté)
- Le hook doit déclencher une émotion sensorielle ou une curiosité en < 10 mots
- Hook raté : "Découvrez notre nouveau plat de saison !" (générique, aucune émotion)
- Hook réussi : "Fondant à cœur, croustillant en surface — notre chef a mis 3 semaines à perfectionner ça."
- Demande : est-ce que ce hook arrête le scroll ? Réponds franchement.

### 3. CTA (→ "revise" si absent ou vague)
- Tout post doit avoir UN CTA clair, adapté à la plateforme
- "Venez nous voir" = CTA invalide (trop vague)
- CTA valide Instagram : lien en bio, DM, story swipe-up
- CTA valide Facebook : numéro de téléphone, lien direct, "Commentez votre date souhaitée"
- CTA valide pour tous : scarcité réelle ("Dernières tables samedi soir")

### 4. Cohérence brand voice
- Les mots à éviter du client sont-ils absents ? Vérification stricte.
- Le ton correspond-il au positionnement (gastronomique ≠ bistrot populaire ≠ bar tendance) ?
- Les mots-clés brand voice apparaissent-ils naturellement ?

### 5. Clichés HORECA (→ "revise" si présents)
Signaler et suggérer remplacement pour :
- "fait maison" → suggérer formulation avec prénom du chef ou date de recette
- "frais du jour" → demander la provenance spécifique
- "venez nombreux" → remplacer par CTA avec action précise
- "notre équipe" → humaniser avec prénoms si possible
- "n'hésitez pas" → supprimer, aucune valeur

### 6. Adéquation plateforme
- Instagram : y a-t-il des hashtags ? (5-8, pas #food #yummy) Saut de ligne avant les hashtags ?
- Facebook : pas de hashtags (si présents, les signaler comme nuisibles à la portée)
- TikTok : le texte est-il court et dynamique ? Premier mot = hook vidéo ?
- Les émojis sont-ils dosés (2-3 max) ?

### 7. Local anchor
- L'établissement est-il ancré localement ? (mention ville, quartier, producteur local, événement local)
- Un abonné de [ville du client] doit se sentir concerné directement.

## Verdicts

- **"ready"** : publiable tel quel. Pas de risque, hook efficace, CTA présent, brand voice respectée.
- **"revise"** : bon potentiel mais 1-2 améliorations concrètes. Donner la suggestion exacte à modifier.
- **"blocked"** : risque réel pour la marque, la conversion, ou la réputation. Expliquer précisément pourquoi.

Sois exigeant mais pragmatique. "blocked" = vraiment nuisible. "revise" = meilleur possible mais publiable.
Réponds en français, en JSON strict, sans markdown.`

  const userPrompt = `# CONTEXTE CLIENT

**Établissement :** ${client.name}
**Type :** ${client.type}
**Ville :** ${client.city || 'non renseignée'}
**Positionnement :** ${client.description || 'non renseigné'}

# VOIX DE MARQUE

**Ton :** ${client.brandVoiceTone || 'non renseigné'}
**Mots-clés :** ${client.brandVoiceKeywords || 'non renseignés'}
**À éviter :** ${client.brandVoiceAvoid || 'non renseigné'}

# STRATÉGIE CLIENT

**Objectif :** ${client.strategy.objective}
**À éviter stratégiquement :** ${client.strategy.avoid.join(', ') || 'non renseigné'}

# POST À SUPERVISER

**Brief :** ${post.brief}
**Plateformes :** ${post.platforms.join(', ')}
**Caption :** ${post.caption}
**Hashtags :** ${post.hashtags.join(', ') || 'aucun'}
**Hook :** ${post.hook || 'non renseigné'}
**CTA :** ${post.cta || 'non renseigné'}
**Prompt image :** ${post.imagePrompt || 'non renseigné'}
**Score impact actuel :** ${post.impactScore}/100

# TÂCHE

Évalue ce post avant publication Meta. Juge la cohérence avec le client, la qualité HORECA, le potentiel de conversion, les risques de promesse, et l'adéquation plateforme.

**Réponds en JSON strict, sans backticks, sans markdown, exactement ce format :**

{
  "verdict": "ready",
  "score": 85,
  "summary": "Avis court en 1-2 phrases.",
  "risks": ["Risque court"],
  "improvements": ["Amélioration courte"],
  "nextAction": "Une seule phrase actionnable."
}`

  try {
    const claude = new Anthropic({ apiKey })
    const message = await claude.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    let parsed: SupervisorReview
    try {
      const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(cleanText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Réponse non parsable comme JSON')
      parsed = JSON.parse(match[0])
    }

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

    return {
      review: normalizeReview(parsed, post.impactScore),
      cost: parseFloat(cost.toFixed(6)),
      tokensUsed: inputTokens + outputTokens,
      model: 'claude-opus-4-7',
    }
  } catch {
    return {
      review: fallbackSupervisorReview(input),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }
}

export function fallbackSupervisorReview(input: { client: Client; post: Post }): SupervisorReview {
  const { post } = input
  const hasImage = Boolean(post.imageUrl)
  const hasCta = /réserv|contact|message|découvr|book|dm|appel|passez/i.test(post.caption)
  const captionLength = post.caption.trim().length
  const hashtagCount = post.hashtags.length
  const hasReasonableCaptionLength = captionLength >= 50 && captionLength <= 1500
  const hasHashtagsInRange = hashtagCount >= 3 && hashtagCount <= 12

  const score = clampScore(
    70 +
      (hasImage ? 5 : 0) +
      (hasCta ? 5 : 0) +
      (hasHashtagsInRange ? 5 : 0) -
      (hasReasonableCaptionLength ? 0 : 10)
  )

  const risks = [
    ...(!hasImage ? ['Aucun visuel associé au post.'] : []),
    ...(!hasCta ? ['CTA insuffisamment explicite pour convertir.'] : []),
    ...(!hasReasonableCaptionLength ? ['Longueur de caption à vérifier avant publication.'] : []),
    ...(!hasHashtagsInRange ? ['Nombre de hashtags hors plage recommandée.'] : []),
  ].slice(0, 5)

  const improvements = [
    ...(!hasImage ? ['Ajouter un visuel cohérent avec le brief.'] : []),
    ...(!hasCta ? ['Ajouter une invitation claire à réserver, contacter ou découvrir.'] : []),
    ...(!hasReasonableCaptionLength ? ['Ajuster la caption entre 50 et 1500 caractères.'] : []),
    ...(!hasHashtagsInRange ? ['Utiliser entre 3 et 12 hashtags ciblés.'] : []),
  ].slice(0, 5)

  return {
    verdict: score >= 80 && hasImage && hasCta ? 'ready' : 'revise',
    score,
    summary: 'Contrôle local sans Claude API : les critères de base sont vérifiés, mais la supervision créative reste limitée.',
    risks,
    improvements,
    nextAction: 'Ajouter ANTHROPIC_API_KEY pour obtenir une vraie supervision Claude.',
  }
}

function normalizeReview(review: SupervisorReview, fallbackScore: number): SupervisorReview {
  const verdicts: SupervisorReview['verdict'][] = ['ready', 'revise', 'blocked']
  const verdict = verdicts.includes(review.verdict) ? review.verdict : 'revise'

  return {
    verdict,
    score: clampScore(Number.isFinite(Number(review.score)) ? Number(review.score) : fallbackScore),
    summary: review.summary || 'Supervision effectuée.',
    risks: Array.isArray(review.risks) ? review.risks.slice(0, 5) : [],
    improvements: Array.isArray(review.improvements) ? review.improvements.slice(0, 5) : [],
    nextAction: review.nextAction || 'Relire le post avant publication.',
  }
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}
