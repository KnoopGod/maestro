import { db } from '../index'

export async function migratePortalToken() {
  // portal_token : jeton de capacité (URL non devinable) donnant au client un accès
  // en lecture seule à son bilan, hors de l'espace admin protégé par mot de passe.
  await db.execute(`ALTER TABLE clients ADD COLUMN portal_token TEXT`).catch(() => undefined)
  await db
    .execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token)`)
    .catch(() => undefined)
}
