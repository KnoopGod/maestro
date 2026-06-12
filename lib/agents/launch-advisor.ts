/**
 * Launch Advisor — conseils d'experts pour le tunnel de lancement client.
 *
 * Trois expertises en un appel :
 *   - Étape 2 : Community Manager Facebook senior (config de page)
 *   - Étape 3 : Stratège Instagram HORECA (compte + grille des 9 premiers posts)
 *   - Étape 4 : Spécialiste technique Meta (connexion API sans accroc)
 *
 * Tous les conseils sont personnalisés au client (type, ville, voix de marque, piliers).
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import { CLIENT_TYPES } from '@/types/client'

export interface LaunchAdvice {
  step2: {
    expert: string
    pageDescription: string
    shortDescription: string
    categorySuggestion: string
    ctaButton: string
    coverPhotoIdea: string
    tips: string[]
  }
  step3: {
    expert: string
    usernameIdeas: string[]
    bio: string
    firstNineGrid: string[]
    tips: string[]
  }
  step4: {
    expert: string
    tips: string[]
  }
}

export async function runLaunchAdvisor(client: Client): Promise<{
  advice: LaunchAdvice
  cost: number
  tokensUsed: number
  model: string
}> {
  const fallback = fallbackAdvice(client)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { advice: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }
  }

  const typeLabel = CLIENT_TYPES[client.type]?.label ?? client.type
  const systemPrompt = `Tu es un panel de trois experts seniors d'une agence social media spécialisée HORECA :

1. **Community Manager Facebook** (10 ans d'expérience pages locales) — tu sais exactement quels champs d'une page Facebook influencent le référencement local, quel bouton d'action convertit le mieux par type d'établissement, et comment écrire une description de page qui ressort dans la recherche Facebook ET Google.

2. **Stratège Instagram HORECA** — tu as lancé des dizaines de comptes hôtels/restaurants. Tu connais les règles d'or : username court et cherchable, bio ≤150 caractères avec proposition de valeur + lieu + CTA lien, et la "grille de 9" qui transforme un profil vide en vitrine crédible avant d'inviter la moindre audience.

3. **Spécialiste technique Meta API** — tu connais les pièges de la connexion Pages/Instagram Business : compte personnel vs professionnel, liaison page↔IG, permissions token, Business Manager.

Tes conseils sont CONCRETS et SPÉCIFIQUES au client (pas de généralités). Tu écris en français. Les textes destinés aux clients finaux (description de page, bio Instagram) respectent la voix de marque et les langues du client — si le client cible une clientèle internationale, propose des textes bilingues FR/EN.`

  const userPrompt = `## Client à lancer

- Nom : ${client.name}
- Type : ${typeLabel}
- Ville : ${client.city ?? 'non précisée'}
- Description : ${client.description ?? '—'}
- Voix de marque : ${client.brandVoiceTone ?? '—'}
- Mots-clés de marque : ${client.brandVoiceKeywords ?? '—'}
- À éviter : ${client.brandVoiceAvoid ?? '—'}
- Langues cibles : ${client.languages.join(', ')}
- Objectif stratégique : ${client.strategy.objective || '—'}
- Piliers de contenu : ${client.strategy.contentPillars.join(' · ') || '—'}

## Mission

Produis les conseils des trois experts pour configurer ses réseaux sociaux de A à Z.

Réponds en JSON strict, sans backticks, sans markdown, exactement ce format :

{
  "step2": {
    "expert": "Community Manager Facebook",
    "pageDescription": "Description complète de page prête à copier-coller (2-4 phrases, voix de marque respectée)",
    "shortDescription": "Description courte ≤155 caractères pour le SEO",
    "categorySuggestion": "Catégorie Facebook exacte à choisir",
    "ctaButton": "Bouton d'action recommandé + où le faire pointer, en 1 phrase",
    "coverPhotoIdea": "Idée précise de photo de couverture pour CE client, en 1-2 phrases",
    "tips": ["3 à 5 conseils spécifiques à ce client pour la page"]
  },
  "step3": {
    "expert": "Stratège Instagram HORECA",
    "usernameIdeas": ["3 propositions de username disponibles-plausibles, courtes, sans underscore multiple"],
    "bio": "Bio Instagram complète ≤150 caractères, avec emojis sobres, lieu et CTA",
    "firstNineGrid": ["9 entrées : sujet précis de chaque post de la grille de lancement, ordonnés pour un rendu visuel cohérent"],
    "tips": ["3 à 4 conseils spécifiques pour le lancement du compte"]
  },
  "step4": {
    "expert": "Spécialiste technique Meta",
    "tips": ["4 à 5 points de vigilance pour connecter ce client à l'outil sans erreur : compte pro, liaison page-IG, token, permissions, rôle admin"]
  }
}`

  try {
    const claude = new Anthropic({ apiKey })
    const message = await claude.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const parsed = parseAdvice(rawText)
    if (!parsed) return { advice: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

    return {
      advice: normalizeAdvice(parsed, fallback),
      cost: parseFloat(cost.toFixed(6)),
      tokensUsed: inputTokens + outputTokens,
      model: 'claude-opus-4-7',
    }
  } catch {
    return { advice: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }
  }
}

// ─── Parsing robuste (Claude enrobe parfois le JSON de markdown) ─────────────

function parseAdvice(raw: string): Partial<LaunchAdvice> | null {
  try { return JSON.parse(raw) } catch { /* tente l'extraction */ }
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

function normalizeAdvice(parsed: Partial<LaunchAdvice>, fallback: LaunchAdvice): LaunchAdvice {
  return {
    step2: {
      expert: parsed.step2?.expert || fallback.step2.expert,
      pageDescription: parsed.step2?.pageDescription || fallback.step2.pageDescription,
      shortDescription: parsed.step2?.shortDescription || fallback.step2.shortDescription,
      categorySuggestion: parsed.step2?.categorySuggestion || fallback.step2.categorySuggestion,
      ctaButton: parsed.step2?.ctaButton || fallback.step2.ctaButton,
      coverPhotoIdea: parsed.step2?.coverPhotoIdea || fallback.step2.coverPhotoIdea,
      tips: Array.isArray(parsed.step2?.tips) && parsed.step2.tips.length ? parsed.step2.tips : fallback.step2.tips,
    },
    step3: {
      expert: parsed.step3?.expert || fallback.step3.expert,
      usernameIdeas: Array.isArray(parsed.step3?.usernameIdeas) && parsed.step3.usernameIdeas.length ? parsed.step3.usernameIdeas : fallback.step3.usernameIdeas,
      bio: parsed.step3?.bio || fallback.step3.bio,
      firstNineGrid: Array.isArray(parsed.step3?.firstNineGrid) && parsed.step3.firstNineGrid.length ? parsed.step3.firstNineGrid : fallback.step3.firstNineGrid,
      tips: Array.isArray(parsed.step3?.tips) && parsed.step3.tips.length ? parsed.step3.tips : fallback.step3.tips,
    },
    step4: {
      expert: parsed.step4?.expert || fallback.step4.expert,
      tips: Array.isArray(parsed.step4?.tips) && parsed.step4.tips.length ? parsed.step4.tips : fallback.step4.tips,
    },
  }
}

// ─── Fallback sans API key ────────────────────────────────────────────────────

const CTA_BY_TYPE: Record<Client['type'], string> = {
  restaurant: 'Bouton "Réserver" → module de réservation (ou WhatsApp si pas de module)',
  hotel: 'Bouton "Réserver" → site de réservation directe (éviter Booking pour garder la marge)',
  bar: 'Bouton "Envoyer un message" → Messenger/WhatsApp pour les privatisations et infos soirées',
  bnb: 'Bouton "Réserver" → page de réservation directe du site',
  restaurant_hotel: 'Bouton "Réserver" → page de réservation directe (chambres + tables)',
}

function fallbackAdvice(client: Client): LaunchAdvice {
  const typeLabel = CLIENT_TYPES[client.type]?.label ?? client.type
  const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const city = client.city ?? ''
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '')

  return {
    step2: {
      expert: 'Community Manager Facebook',
      pageDescription: `${client.name} — ${typeLabel}${city ? ` à ${city}` : ''}. ${client.description ?? 'Une expérience à découvrir.'}`,
      shortDescription: `${client.name} · ${typeLabel}${city ? ` · ${city}` : ''}`.substring(0, 155),
      categorySuggestion: typeLabel,
      ctaButton: CTA_BY_TYPE[client.type],
      coverPhotoIdea: 'La meilleure photo grand-angle du lieu, lumineuse, sans texte incrusté (1640×924px).',
      tips: [
        'Remplir 100% des infos : adresse, horaires, téléphone, WhatsApp, site web.',
        'Demander l\'URL personnalisée facebook.com/' + slug + ' dès que la page est éligible.',
        'Activer les avis et y répondre systématiquement sous 24h.',
      ],
    },
    step3: {
      expert: 'Stratège Instagram HORECA',
      usernameIdeas: [`@${slug}`, citySlug ? `@${slug}${citySlug}` : `@${slug}official`, citySlug ? `@${citySlug}${slug}` : `@the${slug}`],
      bio: `${client.name}${city ? ` 📍 ${city}` : ''} — ${typeLabel}. Réservation ↓`,
      firstNineGrid: [
        'Photo signature du lieu (extérieur / vue)',
        'Détail d\'ambiance (déco, matière, lumière)',
        'Le produit phare (plat, chambre, cocktail)',
        'L\'équipe ou le propriétaire (humain)',
        'Photo grand-angle de l\'espace principal',
        'Détail produit n°2',
        'L\'environnement proche (quartier, plage, vue)',
        'Coulisses (préparation, savoir-faire)',
        'Photo invitation avec CTA réservation',
      ],
      tips: [
        'Passer en compte professionnel AVANT de publier (catégorie : ' + typeLabel + ').',
        'Publier les 9 posts de la grille avant toute promotion du compte.',
        'Lier le compte à la page Facebook dans Paramètres → Comptes liés.',
      ],
    },
    step4: {
      expert: 'Spécialiste technique Meta',
      tips: [
        'Le compte Instagram doit être Professionnel (pas Personnel) et lié à la page Facebook.',
        'Tu dois être Admin de la page Facebook (pas Éditeur) pour générer un token valide.',
        'Générer le token via Graph API Explorer avec les permissions pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish.',
        'Après connexion, utiliser "Diagnostiquer le token" pour vérifier les permissions réelles.',
        'Si la page est dans un Business Manager, l\'app Meta doit y être liée aussi.',
      ],
    },
  }
}
