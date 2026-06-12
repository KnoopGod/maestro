import { db, queryOne } from '../index'
import type { ClientFinanceSettings } from '@/types/finance'

interface FinanceRow {
  client_id: string
  monthly_retainer: number
  target_margin_pct: number
  monthly_api_budget: number
  monthly_meta_ads_budget: number
  monthly_google_ads_budget: number
  planned_posts_per_month: number
  planned_images_per_month: number
  planned_videos_per_month: number
  hourly_internal_rate: number
  monthly_internal_hours: number
  created_at: number
  updated_at: number
}

export const DEFAULT_FINANCE_SETTINGS = {
  monthlyRetainer: 0,
  targetMarginPct: 45,
  monthlyApiBudget: 25,
  monthlyMetaAdsBudget: 0,
  monthlyGoogleAdsBudget: 0,
  plannedPostsPerMonth: 12,
  plannedImagesPerMonth: 12,
  plannedVideosPerMonth: 0,
  hourlyInternalRate: 35,
  monthlyInternalHours: 2,
}

function mapRow(row: FinanceRow): ClientFinanceSettings {
  return {
    clientId: row.client_id,
    monthlyRetainer: row.monthly_retainer,
    targetMarginPct: row.target_margin_pct,
    monthlyApiBudget: row.monthly_api_budget,
    monthlyMetaAdsBudget: row.monthly_meta_ads_budget,
    monthlyGoogleAdsBudget: row.monthly_google_ads_budget,
    plannedPostsPerMonth: row.planned_posts_per_month,
    plannedImagesPerMonth: row.planned_images_per_month,
    plannedVideosPerMonth: row.planned_videos_per_month,
    hourlyInternalRate: row.hourly_internal_rate,
    monthlyInternalHours: row.monthly_internal_hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getClientFinanceSettings(clientId: string): Promise<ClientFinanceSettings> {
  const row = await queryOne<FinanceRow>(
    `SELECT * FROM client_finance_settings WHERE client_id = ?`,
    [clientId]
  )
  if (row) return mapRow(row)

  const now = Date.now()
  return {
    clientId,
    ...DEFAULT_FINANCE_SETTINGS,
    createdAt: now,
    updatedAt: now,
  }
}

export async function saveClientFinanceSettings(
  clientId: string,
  patch: Partial<Omit<ClientFinanceSettings, 'clientId' | 'createdAt' | 'updatedAt'>>
): Promise<ClientFinanceSettings> {
  const current = await getClientFinanceSettings(clientId)
  const next = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  }

  await db.execute({
    sql: `
      INSERT INTO client_finance_settings (
        client_id, monthly_retainer, target_margin_pct, monthly_api_budget,
        monthly_meta_ads_budget, monthly_google_ads_budget,
        planned_posts_per_month, planned_images_per_month, planned_videos_per_month,
        hourly_internal_rate, monthly_internal_hours, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_id) DO UPDATE SET
        monthly_retainer = excluded.monthly_retainer,
        target_margin_pct = excluded.target_margin_pct,
        monthly_api_budget = excluded.monthly_api_budget,
        monthly_meta_ads_budget = excluded.monthly_meta_ads_budget,
        monthly_google_ads_budget = excluded.monthly_google_ads_budget,
        planned_posts_per_month = excluded.planned_posts_per_month,
        planned_images_per_month = excluded.planned_images_per_month,
        planned_videos_per_month = excluded.planned_videos_per_month,
        hourly_internal_rate = excluded.hourly_internal_rate,
        monthly_internal_hours = excluded.monthly_internal_hours,
        updated_at = excluded.updated_at
    `,
    args: [
      clientId,
      next.monthlyRetainer,
      next.targetMarginPct,
      next.monthlyApiBudget,
      next.monthlyMetaAdsBudget,
      next.monthlyGoogleAdsBudget,
      next.plannedPostsPerMonth,
      next.plannedImagesPerMonth,
      next.plannedVideosPerMonth,
      next.hourlyInternalRate,
      next.monthlyInternalHours,
      current.createdAt,
      next.updatedAt,
    ],
  })

  return getClientFinanceSettings(clientId)
}
