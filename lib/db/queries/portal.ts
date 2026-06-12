import { customAlphabet } from 'nanoid'
import { query, queryOne } from '../index'
import { getClient } from './clients'
import type { Client } from '@/types/client'

// URL-safe alphabet, 40 chars ≈ 230 bits d'entropie → jeton de capacité non devinable.
const newToken = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 40)

/**
 * Résout un client à partir de son jeton de portail.
 * Retourne null si le jeton est vide, inconnu ou révoqué — aucune fuite d'information.
 */
export async function getClientByPortalToken(token: string | undefined): Promise<Client | null> {
  if (!token || token.length < 16) return null
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM clients WHERE portal_token = ? LIMIT 1`,
    [token]
  )
  if (!row) return null
  return getClient(row.id)
}

/** Renvoie le jeton existant du client, ou en crée un de façon idempotente. */
export async function ensurePortalToken(clientId: string): Promise<string | null> {
  const existing = await queryOne<{ portal_token: string | null }>(
    `SELECT portal_token FROM clients WHERE id = ? LIMIT 1`,
    [clientId]
  )
  if (!existing) return null
  if (existing.portal_token) return existing.portal_token

  const token = newToken()
  await query(`UPDATE clients SET portal_token = ?, updated_at = ? WHERE id = ?`, [
    token,
    Date.now(),
    clientId,
  ])
  return token
}

/** Régénère le jeton (révoque l'ancien lien). */
export async function rotatePortalToken(clientId: string): Promise<string | null> {
  const existing = await queryOne<{ id: string }>(`SELECT id FROM clients WHERE id = ? LIMIT 1`, [
    clientId,
  ])
  if (!existing) return null

  const token = newToken()
  await query(`UPDATE clients SET portal_token = ?, updated_at = ? WHERE id = ?`, [
    token,
    Date.now(),
    clientId,
  ])
  return token
}
