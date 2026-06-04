'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string
  const expected = process.env.MAESTRO_PASSWORD

  if (!expected || !password || password !== expected) {
    return { error: 'ACCESS DENIED — INVALID CREDENTIALS' }
  }

  const token = await hashPassword(expected)
  const cookieStore = await cookies()
  cookieStore.set('maestro_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  redirect('/')
}
