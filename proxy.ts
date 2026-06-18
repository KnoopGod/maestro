import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, isAuthEnabled, isValidSessionToken } from '@/lib/auth/session'
import { isMultiUserMode } from '@/lib/auth/mode'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/login-v2',
  '/api/auth/logout-v2',
  '/api/auth/me',
  '/api/admin/migrate',
  '/api/cron/publish-due',
  '/api/cron/sync-insights',
  '/api/cron/cleanup-jobs',
  '/privacy',
  '/data-deletion',
]

// Methods that mutate state — validate Origin header on these.
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export async function proxy(req: NextRequest) {
  if (!isAuthEnabled() || isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // CSRF: reject cross-origin mutating requests.
  // SameSite=Strict on the session cookie already prevents most CSRF, but
  // Origin validation adds defense-in-depth for browsers that don't enforce it.
  if (MUTATING_METHODS.has(req.method)) {
    const originError = validateOrigin(req)
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 })
    }
  }

  if (isMultiUserMode()) {
    const sessionCookie = req.cookies.get('maestro_session_v2')?.value
    if (sessionCookie) {
      // Verify session against /api/auth/me (DB lookup not available in Edge runtime)
      const checkRes = await fetch(new URL('/api/auth/me', req.url), {
        headers: { Cookie: `maestro_session_v2=${sessionCookie}` },
      })
      if (checkRes.ok) {
        const data = await checkRes.json().catch(() => ({}))
        if (data?.user) return NextResponse.next()
      }
    }
    // MULTI_USER_MODE active — no V1 fallback
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
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

/**
 * Returns an error string if the request Origin is not the same as the app host,
 * or null if the request is acceptable.
 *
 * We allow requests with no Origin header (server-to-server calls, curl, Vercel cron)
 * because those cannot be triggered by a malicious web page — only browser requests
 * reliably include the Origin header.
 */
function validateOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin')
  if (!origin) return null // non-browser request — allow

  const host = req.headers.get('host')
  if (!host) return 'Missing Host header'

  // Derive the expected origin from the request itself (handles localhost + production)
  const expectedOrigin = `${req.nextUrl.protocol}//${host}`
  if (origin !== expectedOrigin) {
    return `CSRF: origin mismatch (got ${origin}, expected ${expectedOrigin})`
  }
  return null
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  // Portail client : accès par jeton de capacité (vérifié dans la page), hors auth admin.
  if (pathname.startsWith('/portal/')) return true
  if (pathname.startsWith('/api/portal/')) return true
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
