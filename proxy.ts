import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
  '/api/cron/publish-due',
  '/_next',
  '/favicon',
  '/uploads',
]

async function signToken(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('maestro-session'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const password = process.env.MAESTRO_PASSWORD
  if (!password) return NextResponse.next()

  const sessionCookie = req.cookies.get('maestro_session')?.value
  const expected = await signToken(password)

  if (sessionCookie !== expected) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
