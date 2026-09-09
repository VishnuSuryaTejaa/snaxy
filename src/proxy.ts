import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const USER_COOKIE_NAME = 'snaxy_user_session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- User Auth ---
  const userSession = request.cookies.get(USER_COOKIE_NAME)
  const isUserAuthenticated = !!userSession?.value

  // Auth pages redirect to home if already logged in
  const authRoutes = ['/login', '/register']
  if (authRoutes.includes(pathname) && isUserAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register'],
}

