import { NextRequest, NextResponse } from 'next/server'

export function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export { proxy as default }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
