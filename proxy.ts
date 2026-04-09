import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  if (isStatic) return NextResponse.next()

  const token = request.cookies.get('dk-auth')?.value

  // Redirect root to dashboard or login
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url))
  }

  // Not authenticated and trying to access protected page
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated and visiting auth pages → go to dashboard
  if (isPublic && !pathname.startsWith('/api') && token) {
    const payload = verifyToken(token)
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)'],
}
