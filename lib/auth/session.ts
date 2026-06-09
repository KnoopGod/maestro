export const SESSION_COOKIE = 'codexrs_session'
export const LEGACY_SESSION_COOKIE = 'maestro_session'

export function getAuthPassword() {
  return process.env.CODEXRS_PASSWORD || process.env.MAESTRO_PASSWORD || ''
}

export function isAuthEnabled() {
  return getAuthPassword().length > 0
}

export async function signSessionToken(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('codexrs-session'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  const password = getAuthPassword()
  if (!password || !token) return false

  const expected = await signSessionToken(password)
  return timingSafeEqual(token, expected)
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
