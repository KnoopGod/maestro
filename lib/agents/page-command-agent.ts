import Anthropic from '@anthropic-ai/sdk'
import { resolvePageAgent, type PageAgentProfile } from './page-agent-registry'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'

export interface PageAgentResponse {
  agent: PageAgentProfile
  answer: string
  nextActions: string[]
  risks: string[]
  cost: number
  model: string
}

export async function runPageCommandAgent(input: {
  path: string
  prompt: string
}): Promise<PageAgentResponse> {
  const agent = resolvePageAgent(input.path)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallback(agent, input.prompt)

  const anthropic = new Anthropic({ apiKey })
  const system = `Tu es ${agent.name}, agent runtime de CODEXRS.
Rôle: ${agent.role}
Spécialité: ${agent.specialty}
Page active: ${agent.pageScope} (${input.path})

CODEXRS est un outil interne pour gérer les clients HORECA: profil client, stratégie, Library, Studio, validation, calendrier, publication Meta, analytics et rentabilité.

Tu réponds comme un directeur d'agence senior: concret, orienté action, sans exécuter d'action destructrice.
Si l'ordre demande une suppression, publication, rotation de token ou action risquée, propose les étapes et demande validation dans l'interface.

Réponds en JSON strict:
{
  "answer": "réponse courte et actionnable",
  "nextActions": ["action 1", "action 2"],
  "risks": ["risque ou limite éventuelle"]
}`

  const message = await anthropic.messages.create({
    model: AGENT_MODELS.sonnet,
    max_tokens: 1200,
    system,
    messages: [{ role: 'user', content: input.prompt }],
  })

  const textBlock = message.content.find(block => block.type === 'text')
  const raw = textBlock?.type === 'text' ? textBlock.text : ''
  const cost = calcCost('sonnet', message.usage.input_tokens, message.usage.output_tokens)

  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean) as Partial<Pick<PageAgentResponse, 'answer' | 'nextActions' | 'risks'>>
    return {
      agent,
      answer: parsed.answer || raw || 'Ordre reçu.',
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      cost,
      model: AGENT_MODELS.sonnet,
    }
  } catch {
    return {
      agent,
      answer: raw || 'Ordre reçu.',
      nextActions: [],
      risks: [],
      cost,
      model: AGENT_MODELS.sonnet,
    }
  }
}

function fallback(agent: PageAgentProfile, prompt: string): PageAgentResponse {
  return {
    agent,
    answer: `J'ai bien reçu l'ordre: "${prompt}". Ajoute ANTHROPIC_API_KEY pour obtenir une réponse experte complète de ${agent.name}.`,
    nextActions: ['Vérifier les connexions IA', 'Reformuler l’ordre avec le client ou la page concernée'],
    risks: ['Réponse limitée car Claude API n’est pas configuré'],
    cost: 0,
    model: 'fallback',
  }
}
