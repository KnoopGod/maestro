import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

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

function signToken(password: string): string {
  return createHmac('sha256', password).update('maestro-session').digest('hex')
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const password = process.env.MAESTRO_PASSWORD
  if (!password) return NextResponse.next() // no auth configured → dev mode

  const sessionCookie = req.cookies.get('maestro_session')?.value
  const expected = signToken(password)

  if (sessionCookie !== expected) {
    // API routes → 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    // Pages → redirect to login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
