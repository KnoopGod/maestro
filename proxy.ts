import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, isAuthEnabled, isValidSessionToken } from '@/lib/auth/session'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/cron/publish-due',
  '/privacy',
  '/data-deletion',
]

export async function proxy(req: NextRequest) {
  if (!isAuthEnabled() || isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const valid = await isValidSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (valid) return NextResponse.next()

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(loginUrl)
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  // Portail client : accès par jeton de capacité (vérifié dans la page), hors auth admin.
  if (pathname.startsWith('/portal/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname === '/favicon.ico') return true
  if (pathname === '/robots.txt') return true
  if (pathname === '/sitemap.xml') return true
  return false
}

export { proxy as default }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
