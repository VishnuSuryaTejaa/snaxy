import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const USER_COOKIE_NAME = 'snaxy_user_session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Admin auth is handled by the layout.tsx component (rendering AdminLoginForm)
  // --- User Auth ---
  const userSession = request.cookies.get(USER_COOKIE_NAME)
  const isUserAuthenticated = !!userSession?.value

  const protectedUserRoutes = ['/checkout', '/orders']
  const isProtectedUserRoute = protectedUserRoutes.some(route => pathname.startsWith(route))

  if (isProtectedUserRoute && !isUserAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const authRoutes = ['/login', '/register']
  if (authRoutes.includes(pathname) && isUserAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/checkout', '/orders', '/login', '/register'],
}
