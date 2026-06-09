'use server'

import { revalidatePath } from 'next/cache'
import { saveClientFinanceSettings } from '@/lib/db/queries/finance'

export async function updateClientFinanceAction(clientId: string, formData: FormData) {
  await saveClientFinanceSettings(clientId, {
    monthlyRetainer: readMoney(formData, 'monthlyRetainer'),
    targetMarginPct: readMoney(formData, 'targetMarginPct'),
    monthlyApiBudget: readMoney(formData, 'monthlyApiBudget'),
    monthlyMetaAdsBudget: readMoney(formData, 'monthlyMetaAdsBudget'),
    monthlyGoogleAdsBudget: readMoney(formData, 'monthlyGoogleAdsBudget'),
    plannedPostsPerMonth: readInteger(formData, 'plannedPostsPerMonth'),
    plannedImagesPerMonth: readInteger(formData, 'plannedImagesPerMonth'),
    plannedVideosPerMonth: readInteger(formData, 'plannedVideosPerMonth'),
    hourlyInternalRate: readMoney(formData, 'hourlyInternalRate'),
    monthlyInternalHours: readMoney(formData, 'monthlyInternalHours'),
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}/finance`)
  revalidatePath('/usage')
}

function readMoney(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '0').replace(',', '.').trim()
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function readInteger(formData: FormData, key: string) {
  return Math.round(readMoney(formData, key))
}
