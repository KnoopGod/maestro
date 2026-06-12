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
import { CLIENT_TYPES, type ClientType } from '@/types/client'

export async function createClientAction(formData: FormData) {
  const clientId = String(formData.get('clientId') ?? '').trim() || nanoid(12)
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? '') as ClientType
  const city = String(formData.get('city') ?? '').trim() || undefined
  const description = String(formData.get('description') ?? '').trim() || undefined
  const clientSummary = String(formData.get('clientSummary') ?? '').trim() || undefined
  const brandVoiceTone = String(formData.get('brandVoiceTone') ?? '').trim() || undefined
  const brandVoiceKeywords = String(formData.get('brandVoiceKeywords') ?? '').trim() || undefined

  if (!name || !type) throw new Error('Name and type required')
  if (!(type in CLIENT_TYPES)) throw new Error('Invalid type')

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
    emoji: typeConfig.emoji,
    color: typeConfig.color,
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
  const optionalFields = ['city', 'description', 'clientSummary', 'brandVoiceTone', 'brandVoiceKeywords', 'brandVoiceAvoid']
  for (const field of optionalFields) {
    const val = formData.get(field)
    if (val !== null) {
      const trimmed = String(val).trim()
      patch[field] = trimmed === '' ? null : trimmed
    }
  }

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

export async function deleteClientAction(id: string) {
  await dbDeleteClient(id)
  revalidatePath('/clients')
  redirect('/clients')
}

export async function deleteClientsAction(ids: string[]) {
  await dbDeleteClients(ids)
  revalidatePath('/clients')
}
