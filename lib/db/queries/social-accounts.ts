import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'
import type { ClientSocialAccount, SocialPlatform } from '@/types/client'

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

function mapRow(row: SocialAccountRow): ClientSocialAccount {
  return {
    id: row.id,
    clientId: row.client_id,
    platform: row.platform,
    handle: row.handle,
    accountId: row.account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    connectedAt: row.connected_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

export async function listClientSocialAccounts(clientId: string): Promise<ClientSocialAccount[]> {
  const rows = await query<SocialAccountRow>(
    `SELECT * FROM client_social_accounts WHERE client_id = ? ORDER BY created_at DESC`,
    [clientId]
  )
  return rows.map(mapRow)
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
      input.accessToken,
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
