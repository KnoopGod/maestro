import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'
import type { ClientAsset, VisualIdentity, AssetType, AssetCategory } from '@/types/asset'

interface AssetRow {
  id: string
  client_id: string
  type: AssetType
  category: AssetCategory | null
  filename: string
  original_name: string
  url: string
  thumbnail_url: string | null
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  ai_description: string | null
  ai_tags: string | null
  dominant_colors: string | null
  mood: string | null
  extracted_text: string | null
  analyzed_at: number | null
  starred: number
  used_count: number
  created_at: number
}

function mapAssetRow(row: AssetRow): ClientAsset {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type,
    category: row.category,
    filename: row.filename,
    originalName: row.original_name,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    aiDescription: row.ai_description,
    aiTags: row.ai_tags ? JSON.parse(row.ai_tags) : [],
    dominantColors: row.dominant_colors ? JSON.parse(row.dominant_colors) : [],
    mood: row.mood,
    extractedText: row.extracted_text,
    analyzedAt: row.analyzed_at,
    starred: !!row.starred,
    usedCount: row.used_count,
    createdAt: row.created_at,
  }
}

export async function listClientAssets(clientId: string, type?: AssetType): Promise<ClientAsset[]> {
  const rows = type
    ? await query<AssetRow>(
        `SELECT * FROM client_assets WHERE client_id = ? AND type = ? ORDER BY created_at DESC`,
        [clientId, type]
      )
    : await query<AssetRow>(
        `SELECT * FROM client_assets WHERE client_id = ? ORDER BY created_at DESC`,
        [clientId]
      )
  return rows.map(mapAssetRow)
}

export async function getAsset(id: string): Promise<ClientAsset | null> {
  const row = await queryOne<AssetRow>(`SELECT * FROM client_assets WHERE id = ?`, [id])
  return row ? mapAssetRow(row) : null
}

export async function createAsset(input: {
  clientId: string
  type: AssetType
  category?: AssetCategory
  filename: string
  originalName: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  durationSeconds?: number
  extractedText?: string
}): Promise<ClientAsset> {
  const id = nanoid(12)
  const now = Date.now()

  await db.execute({
    sql: `INSERT INTO client_assets (
      id, client_id, type, category, filename, original_name, url, thumbnail_url,
      mime_type, size_bytes, width, height, duration_seconds, extracted_text,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.clientId,
      input.type,
      input.category ?? null,
      input.filename,
      input.originalName,
      input.url,
      input.thumbnailUrl ?? null,
      input.mimeType,
      input.sizeBytes,
      input.width ?? null,
      input.height ?? null,
      input.durationSeconds ?? null,
      input.extractedText ?? null,
      now,
    ],
  })

  const asset = await getAsset(id)
  if (!asset) throw new Error('Failed to create asset')
  return asset
}

export async function updateAssetAnalysis(id: string, analysis: {
  aiDescription?: string
  aiTags?: string[]
  dominantColors?: string[]
  mood?: string
}): Promise<void> {
  const now = Date.now()
  await db.execute({
    sql: `UPDATE client_assets SET
      ai_description = ?,
      ai_tags = ?,
      dominant_colors = ?,
      mood = ?,
      analyzed_at = ?
    WHERE id = ?`,
    args: [
      analysis.aiDescription ?? null,
      JSON.stringify(analysis.aiTags ?? []),
      JSON.stringify(analysis.dominantColors ?? []),
      analysis.mood ?? null,
      now,
      id,
    ],
  })
}

export async function deleteAsset(id: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM client_assets WHERE id = ?`, args: [id] })
}

export async function setAssetStarred(id: string, starred: boolean): Promise<void> {
  await db.execute({
    sql: `UPDATE client_assets SET starred = ? WHERE id = ?`,
    args: [starred ? 1 : 0, id],
  })
}

export async function incrementAssetUsage(id: string): Promise<void> {
  await db.execute({
    sql: `UPDATE client_assets SET used_count = used_count + 1 WHERE id = ?`,
    args: [id],
  })
}

// ─── Visual Identity ──────────────────────────────────────────────────────────

interface IdentityRow {
  client_id: string
  palette: string | null
  lighting_style: string | null
  overall_mood: string | null
  composition_pref: string | null
  style_keywords: string | null
  avoid_keywords: string | null
  style_prompt: string | null
  visual_summary: string | null
  analyzed_at: number | null
  assets_count: number
}

function mapIdentityRow(row: IdentityRow): VisualIdentity {
  return {
    clientId: row.client_id,
    palette: row.palette ? JSON.parse(row.palette) : [],
    lightingStyle: row.lighting_style,
    overallMood: row.overall_mood,
    compositionPref: row.composition_pref,
    styleKeywords: row.style_keywords ? JSON.parse(row.style_keywords) : [],
    avoidKeywords: row.avoid_keywords ? JSON.parse(row.avoid_keywords) : [],
    stylePrompt: row.style_prompt,
    visualSummary: row.visual_summary,
    analyzedAt: row.analyzed_at,
    assetsCount: row.assets_count,
  }
}

export async function getVisualIdentity(clientId: string): Promise<VisualIdentity | null> {
  const row = await queryOne<IdentityRow>(
    `SELECT * FROM client_visual_identity WHERE client_id = ?`,
    [clientId]
  )
  return row ? mapIdentityRow(row) : null
}

export async function upsertVisualIdentity(input: {
  clientId: string
  palette: string[]
  lightingStyle: string
  overallMood: string
  compositionPref: string
  styleKeywords: string[]
  avoidKeywords: string[]
  stylePrompt: string
  visualSummary: string
  assetsCount: number
}): Promise<VisualIdentity> {
  const now = Date.now()
  await db.execute({
    sql: `INSERT INTO client_visual_identity (
      client_id, palette, lighting_style, overall_mood, composition_pref,
      style_keywords, avoid_keywords, style_prompt, visual_summary,
      analyzed_at, assets_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(client_id) DO UPDATE SET
      palette = excluded.palette,
      lighting_style = excluded.lighting_style,
      overall_mood = excluded.overall_mood,
      composition_pref = excluded.composition_pref,
      style_keywords = excluded.style_keywords,
      avoid_keywords = excluded.avoid_keywords,
      style_prompt = excluded.style_prompt,
      visual_summary = excluded.visual_summary,
      analyzed_at = excluded.analyzed_at,
      assets_count = excluded.assets_count`,
    args: [
      input.clientId,
      JSON.stringify(input.palette),
      input.lightingStyle,
      input.overallMood,
      input.compositionPref,
      JSON.stringify(input.styleKeywords),
      JSON.stringify(input.avoidKeywords),
      input.stylePrompt,
      input.visualSummary,
      now,
      input.assetsCount,
    ],
  })

  const identity = await getVisualIdentity(input.clientId)
  if (!identity) throw new Error('Failed to upsert visual identity')
  return identity
}
