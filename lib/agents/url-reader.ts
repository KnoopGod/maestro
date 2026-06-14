import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'

export interface UrlBriefResult {
  brief: string
  title: string
  keyPoints: string[]
  suggestedPillar: string | null
  cost: number
  tokensUsed: number
  model: string
}

const MAX_HTML_LENGTH = 40_000

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{3,}/g, '\n\n')
    .trim()
    .substring(0, MAX_HTML_LENGTH)
}

export async function extractBriefFromUrl(url: string, client: Client): Promise<UrlBriefResult> {
  // Fetch the URL server-side
  let pageText = ''
  let pageTitle = ''
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MAESTRO-bot/1.0; +https://maestro.agency)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    pageText = stripHtml(html)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    pageTitle = titleMatch ? titleMatch[1].trim() : ''
  } catch (err) {
    throw new Error(`Impossible de lire l'URL : ${err instanceof Error ? err.message : 'erreur réseau'}`)
  }

  if (!pageText) throw new Error('La page ne contient pas de texte lisible')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      brief: `Contenu de ${pageTitle || url}`,
      title: pageTitle,
      keyPoints: [pageText.substring(0, 200)],
      suggestedPillar: null,
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }

  const anthropic = new Anthropic({ apiKey })
  const systemPrompt = buildExpertSystemPrompt('account-director', `Tu es **Content Strategist** pour une agence HORECA.
Tu lis le contenu d'une page web et en extrais les informations clés pour créer un brief de post social.
Réponds en JSON strict, sans markdown.`)

  const userPrompt = `# CLIENT
Nom : ${client.name}
Type : ${client.type}
Ville : ${client.city || 'non renseignée'}
Ton : ${client.brandVoiceTone || 'non renseigné'}

# URL ANALYSÉE
${url}

# CONTENU DE LA PAGE (extrait)
${pageText.substring(0, 8000)}

# TÂCHE
Analyse ce contenu et génère un JSON avec ces champs :
- "brief": string — un brief de post social prêt à utiliser (2-3 phrases, impératif, actionnable). Adapté au client HORECA.
- "title": string — titre court de l'événement ou sujet principal
- "keyPoints": string[] — 3-5 points clés extraits du contenu
- "suggestedPillar": string | null — pilier de contenu parmi ceux typiques HORECA : "Plat du jour", "Événement", "Coulisses", "Offre spéciale", "Ambiance", "Témoignage client", "Saisonnalité", ou null si non déterminable

JSON uniquement.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const cost = parseFloat(((inputTokens * 0.00000080) + (outputTokens * 0.00000400)).toFixed(6))

  // Parse JSON with regex fallback
  let parsed: { brief?: string; title?: string; keyPoints?: string[]; suggestedPillar?: string | null } = {}
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch {
    // fallback
  }

  return {
    brief: typeof parsed.brief === 'string' ? parsed.brief : `Contenu de ${pageTitle || url}`,
    title: typeof parsed.title === 'string' ? parsed.title : pageTitle,
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(s => typeof s === 'string') : [],
    suggestedPillar: typeof parsed.suggestedPillar === 'string' ? parsed.suggestedPillar : null,
    cost,
    tokensUsed: inputTokens + outputTokens,
    model: response.model,
  }
}
