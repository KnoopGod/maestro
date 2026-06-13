import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'
import type { ClientSocialAccount, SocialPlatform } from '@/types/client'
import { encryptToken, decryptToken } from '@/lib/crypto/tokens'

interface SocialAccountRow {
  id: string
  client_id: string
  platform: SocialPlatform
  handle: string | null
  account_id: string | null
  access_token: string | null
  refresh_token: string | null
  connected_at: number | null
  expires_at: number | null
  created_at: number
}

async function mapRow(row: SocialAccountRow): Promise<ClientSocialAccount> {
  let accessToken = row.access_token
  let refreshToken = row.refresh_token

  if (accessToken) {
    try {
      accessToken = await decryptToken(accessToken, row.client_id)
    } catch {
      // Decryption failed — token may be corrupted; surface null so callers can prompt reconnection
      accessToken = null
    }
  }
  if (refreshToken) {
    try {
      refreshToken = await decryptToken(refreshToken, row.client_id)
    } catch {
      refreshToken = null
    }
  }

  return {
    id: row.id,
    clientId: row.client_id,
    platform: row.platform,
    handle: row.handle,
    accountId: row.account_id,
    accessToken,
    refreshToken,
    connectedAt: row.connected_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

export interface ClientSocialAccountSummary {
  platform: SocialPlatform
  handle: string | null
  accountId: string | null
  connectedAt: number | null
  expiresAt: number | null
  hasAccessToken: boolean
}

export async function listClientSocialAccounts(clientId: string): Promise<ClientSocialAccount[]> {
  const rows = await query<SocialAccountRow>(
    `SELECT * FROM client_social_accounts WHERE client_id = ? ORDER BY created_at DESC`,
    [clientId]
  )
  return Promise.all(rows.map(mapRow))
}

export async function listClientSocialAccountSummaries(clientId: string): Promise<ClientSocialAccountSummary[]> {
  const rows = await query<{
    platform: SocialPlatform
    handle: string | null
    account_id: string | null
    connected_at: number | null
    expires_at: number | null
    has_access_token: number
  }>(
    `SELECT
      platform,
      handle,
      account_id,
      connected_at,
      expires_at,
      CASE WHEN access_token IS NOT NULL AND access_token != '' THEN 1 ELSE 0 END AS has_access_token
    FROM client_social_accounts
    WHERE client_id = ?
    ORDER BY created_at DESC`,
    [clientId]
  )

  return rows.map(row => ({
    platform: row.platform,
    handle: row.handle,
    accountId: row.account_id,
    connectedAt: row.connected_at,
    expiresAt: row.expires_at,
    hasAccessToken: row.has_access_token === 1,
  }))
}

export async function getSocialAccount(clientId: string, platform: SocialPlatform): Promise<ClientSocialAccount | null> {
  const row = await queryOne<SocialAccountRow>(
    `SELECT * FROM client_social_accounts WHERE client_id = ? AND platform = ?`,
    [clientId, platform]
  )
  return row ? mapRow(row) : null
}


export async function saveSocialAccount(input: {
  clientId: string
  platform: SocialPlatform
  handle: string
  accountId: string
  accessToken: string
  expiresAt?: number
}): Promise<ClientSocialAccount> {
  const encryptedToken = await encryptToken(input.accessToken, input.clientId)

  // Upsert: delete any existing then insert (simpler than ON CONFLICT for our case)
  await db.execute({
    sql: `DELETE FROM client_social_accounts WHERE client_id = ? AND platform = ?`,
    args: [input.clientId, input.platform],
  })

  const id = nanoid(12)
  const now = Date.now()

  await db.execute({
    sql: `INSERT INTO client_social_accounts (
      id, client_id, platform, handle, account_id, access_token,
      connected_at, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.clientId,
      input.platform,
      input.handle,
      input.accountId,
      encryptedToken,
      now,
      input.expiresAt ?? null,
      now,
    ],
  })

  const account = await getSocialAccount(input.clientId, input.platform)
  if (!account) throw new Error('Failed to save social account')
  return account
}

export async function deleteSocialAccount(clientId: string, platform: SocialPlatform): Promise<void> {
  await db.execute({
    sql: `DELETE FROM client_social_accounts WHERE client_id = ? AND platform = ?`,
    args: [clientId, platform],
  })
}
