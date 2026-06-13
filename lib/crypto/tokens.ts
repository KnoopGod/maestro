/**
 * AES-256-GCM encryption for Meta access tokens stored in the database.
 *
 * Key derivation: PBKDF2(MAESTRO_ENCRYPTION_KEY, clientId, 100_000 iterations)
 * This means each client's tokens use a unique derived key — a token from one
 * client cannot be decrypted with another client's derived key.
 *
 * Storage format: JSON string `{"v":1,"iv":"<hex>","tag":"<hex>","ct":"<hex>"}`
 *
 * If MAESTRO_ENCRYPTION_KEY is not set the token is stored in cleartext with a
 * warning. Cleartext tokens are read back as-is (backwards-compatible), so
 * existing deployments keep working until the key is configured and tokens are
 * reconnected.
 */

const ENCRYPTED_PREFIX = '{"v":1,'

function getEncryptionKey(): string | null {
  return process.env.MAESTRO_ENCRYPTION_KEY ?? null
}

async function deriveKey(masterKey: string, clientId: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterKey),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(clientId),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): ArrayBuffer {
  const buf = new ArrayBuffer(hex.length / 2)
  const view = new Uint8Array(buf)
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return buf
}

export async function encryptToken(plaintext: string, clientId: string): Promise<string> {
  const masterKey = getEncryptionKey()
  if (!masterKey) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[crypto/tokens] MAESTRO_ENCRYPTION_KEY not set — storing token in cleartext')
    }
    return plaintext
  }

  const key = await deriveKey(masterKey, clientId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )

  // AES-GCM appends the 16-byte auth tag at the end of the ciphertext buffer
  const cipherBytes = new Uint8Array(cipherBuf)
  const tag = cipherBytes.slice(-16)
  const ct = cipherBytes.slice(0, -16)

  return JSON.stringify({ v: 1, iv: toHex(iv), tag: toHex(tag), ct: toHex(ct) })
}

export async function decryptToken(stored: string, clientId: string): Promise<string> {
  if (!stored.startsWith(ENCRYPTED_PREFIX)) {
    // Cleartext fallback — token was stored before encryption was enabled
    return stored
  }

  const masterKey = getEncryptionKey()
  if (!masterKey) {
    // Cannot decrypt: key was removed after tokens were encrypted
    throw new Error('MAESTRO_ENCRYPTION_KEY is required to decrypt stored tokens')
  }

  const { iv, tag, ct } = JSON.parse(stored) as { v: number; iv: string; tag: string; ct: string }
  const key = await deriveKey(masterKey, clientId)

  // Reassemble ciphertext + tag into a single ArrayBuffer as expected by SubtleCrypto
  const ctBytes = new Uint8Array(fromHex(ct))
  const tagBytes = new Uint8Array(fromHex(tag))
  const combined = new ArrayBuffer(ctBytes.length + tagBytes.length)
  const combinedView = new Uint8Array(combined)
  combinedView.set(ctBytes)
  combinedView.set(tagBytes, ctBytes.length)

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromHex(iv) },
    key,
    combined
  )

  return new TextDecoder().decode(plainBuf)
}

/** Returns true if the stored value is an encrypted envelope (not cleartext). */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(ENCRYPTED_PREFIX)
}
