import assert from 'node:assert/strict'
import test from 'node:test'
import { buildImagePrompt } from '@/lib/agents/image-generator'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'
import { createClientStrategy } from '@/lib/agents/strategy-director'
import { buildVideoPrompt } from '@/lib/agents/video-creator'
import {
  getPlaybook,
  getPlaybookForClient,
  isKnownVertical,
  VERTICAL_OPTIONS,
} from '@/lib/playbooks'
import type { Client, ClientBusinessProfile } from '@/types/client'

const b2bProfile: ClientBusinessProfile = {
  vertical: 'societe-b2b',
  mainOffers: ['Tissus recyclés'],
  avgBasketEur: 2500,
  peakDays: [],
  offDays: [],
  conversionChannels: ['linkedin_dm', 'email', 'phone', 'website'],
  monthlyRevenueEur: null,
  priorityObjective: 'generate_leads',
  targetDelay: '3m',
  constraints: [],
  localCompetitors: [],
  seasonality: null,
}

const b2bClient: Client = {
  id: 'client-b2b',
  name: 'Textile Pro',
  type: 'bar',
  city: 'Lyon',
  status: 'active',
  emoji: '💼',
  color: 'from-purple-600 to-fuchsia-700',
  description: 'Fabricant textile pour les marques et professionnels.',
  clientSummary: 'Fabricant B2B orienté devis et échantillons.',
  internalNotes: null,
  brandVoiceTone: 'expert et humain',
  brandVoiceKeywords: 'savoir-faire, qualité',
  brandVoiceAvoid: null,
  languages: ['fr'],
  strategy: {
    objective: 'Générer des leads qualifiés.',
    contentPillars: ['Étude de cas client', 'Coulisses production'],
    platforms: ['linkedin', 'instagram'],
    frequency: '3 posts/semaine',
    bestTimes: ['08:30', '12:00'],
    avoid: [],
  },
  businessProfile: b2bProfile,
  createdAt: 0,
  updatedAt: 0,
}

test('la verticale métier prime sur le type legacy', () => {
  assert.equal(getPlaybookForClient(b2bClient).vertical, 'societe-b2b')
  assert.equal(getPlaybookForClient(b2bClient).label, 'Société B2B')
})

test('le prompt image B2B ne décrit jamais un bar ou un univers hospitality', () => {
  const prompt = buildImagePrompt({
    client: b2bClient,
    brief: 'Présenter une gamme de tissus recyclés.',
    caption: 'Demandez un échantillon.',
    visualIdentity: null,
  })

  assert.match(prompt, /Société B2B/)
  assert.doesNotMatch(prompt, /for a bar/i)
  assert.doesNotMatch(prompt, /hospitality photography/i)
})

test('Resto + Hôtel reste une verticale sélectionnable', () => {
  assert.equal(isKnownVertical('restaurant_hotel'), true)
  assert.equal(getPlaybook('restaurant_hotel').legacyType, 'restaurant_hotel')
  assert.equal(
    VERTICAL_OPTIONS.some(option => option.vertical === 'restaurant_hotel'),
    true
  )
})

test('la stratégie B2B vise les leads et inclut LinkedIn', () => {
  const strategy = createClientStrategy({
    type: 'bar',
    name: b2bClient.name,
    city: b2bClient.city ?? '',
    positioning: b2bClient.description ?? '',
    tone: b2bClient.brandVoiceTone ?? '',
    offerFocus: 'Tissus recyclés',
    businessProfile: b2bProfile,
  })

  assert.match(strategy.objective, /demandes de devis/)
  assert.equal(strategy.platforms.includes('linkedin'), true)
  assert.deepEqual(strategy.contentPillars, getPlaybook('societe-b2b').strategy.contentPillars)
})

test('le socle expert partagé ne réinjecte pas un contexte HORECA', () => {
  const prompt = buildExpertSystemPrompt('social-expert', 'Contexte Société B2B')
  assert.doesNotMatch(prompt, /HORECA/)
  assert.match(prompt, /multi-secteurs/)
})

test('le prompt vidéo par défaut reste neutre pour tous les secteurs', () => {
  const prompt = buildVideoPrompt({})
  assert.doesNotMatch(prompt, /HORECA|food|hospitality/i)
  assert.match(prompt, /brand/i)
})
