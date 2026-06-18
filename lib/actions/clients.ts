'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'
import {
  createClient as dbCreateClient,
  updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient,
  deleteClients as dbDeleteClients,
} from '@/lib/db/queries/clients'
import {
  BUSINESS_OBJECTIVES,
  BUSINESS_TARGET_DELAYS,
  CLIENT_TYPES,
  CONVERSION_CHANNELS,
  type BusinessObjective,
  type BusinessTargetDelay,
  type ClientBusinessProfile,
  type ClientType,
  type ConversionChannel,
} from '@/types/client'
import { getPlaybook } from '@/lib/playbooks'

export async function createClientAction(formData: FormData) {
  const clientId = String(formData.get('clientId') ?? '').trim() || nanoid(12)
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? '') as ClientType
  const city = String(formData.get('city') ?? '').trim() || undefined
  const description = String(formData.get('description') ?? '').trim() || undefined
  const clientSummary = String(formData.get('clientSummary') ?? '').trim() || undefined
  const brandVoiceTone = String(formData.get('brandVoiceTone') ?? '').trim() || undefined
  const brandVoiceKeywords = String(formData.get('brandVoiceKeywords') ?? '').trim() || undefined
  const businessProfile = buildBusinessProfile(formData)

  if (!name || !type) throw new Error('Name and type required')
  if (!(type in CLIENT_TYPES)) throw new Error('Invalid type')

  const playbook = businessProfile ? getPlaybook(businessProfile.vertical) : null
  const typeConfig = CLIENT_TYPES[type]

  const client = await dbCreateClient({
    id: clientId,
    name,
    type,
    city,
    description,
    clientSummary,
    brandVoiceTone,
    brandVoiceKeywords,
    emoji: playbook?.emoji ?? typeConfig.emoji,
    color: typeConfig.color,
    businessProfile,
  })

  revalidatePath('/clients')
  redirect(`/clients/${client.id}`)
}

export async function updateClientAction(id: string, formData: FormData) {
  const patch: Record<string, unknown> = {}

  // Required fields — keep value or skip if empty
  const requiredFields = ['name', 'type', 'status']
  for (const field of requiredFields) {
    const val = formData.get(field)
    if (val !== null && String(val).trim() !== '') {
      patch[field] = String(val).trim()
    }
  }

  // Optional fields — null if empty
  const optionalFields = ['city', 'description', 'clientSummary', 'internalNotes', 'brandVoiceTone', 'brandVoiceKeywords', 'brandVoiceAvoid']
  for (const field of optionalFields) {
    const val = formData.get(field)
    if (val !== null) {
      const trimmed = String(val).trim()
      patch[field] = trimmed === '' ? null : trimmed
    }
  }

  patch.businessProfile = buildBusinessProfile(formData)

  // Validate type if provided
  if (patch.type && !(patch.type as string in CLIENT_TYPES)) {
    throw new Error(`Type invalide : ${patch.type}`)
  }

  // Update emoji + color if type changed
  if (patch.type) {
    const typeCfg = CLIENT_TYPES[patch.type as ClientType]
    patch.emoji = typeCfg.emoji
    patch.color = typeCfg.color
  }

  await dbUpdateClient(id, patch)
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}

function buildBusinessProfile(formData: FormData): ClientBusinessProfile | null {
  const vertical = String(formData.get('businessVertical') ?? '').trim()
  if (!vertical) return null

  const priorityObjective = normalizeBusinessObjective(formData.get('priorityObjective'))
  const targetDelay = normalizeTargetDelay(formData.get('targetDelay'))
  const conversionChannels = formData
    .getAll('conversionChannels')
    .map(value => String(value).trim())
    .filter(isConversionChannel)

  return {
    vertical,
    mainOffers: splitList(formData.get('mainOffers')),
    avgBasketEur: parseNullableNumber(formData.get('avgBasketEur')),
    peakDays: splitList(formData.get('peakDays')),
    offDays: splitList(formData.get('offDays')),
    conversionChannels: conversionChannels.length ? conversionChannels : ['instagram_dm'],
    monthlyRevenueEur: parseNullableNumber(formData.get('monthlyRevenueEur')),
    priorityObjective,
    targetDelay,
    constraints: splitList(formData.get('businessConstraints')),
    localCompetitors: splitList(formData.get('localCompetitors')),
    seasonality: nullableString(formData.get('seasonality')),
  }
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? '').trim()
  return trimmed || null
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? '').trim().replace(',', '.')
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeBusinessObjective(value: FormDataEntryValue | null): BusinessObjective {
  const raw = String(value ?? '').trim()
  return raw in BUSINESS_OBJECTIVES ? raw as BusinessObjective : 'attract_new_customers'
}

function normalizeTargetDelay(value: FormDataEntryValue | null): BusinessTargetDelay {
  const raw = String(value ?? '').trim()
  return raw in BUSINESS_TARGET_DELAYS ? raw as BusinessTargetDelay : '3m'
}

function isConversionChannel(value: string): value is ConversionChannel {
  return value in CONVERSION_CHANNELS
}

export async function deleteClientAction(id: string) {
  await dbDeleteClient(id)
  revalidatePath('/clients')
  redirect('/clients')
}

export async function deleteClientsAction(ids: string[]) {
  await dbDeleteClients(ids)
  revalidatePath('/clients')
}
