import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  const authRoutes = ['/login', '/signup']
  
  const { pathname } = request.nextUrl

  // If user is trying to access protected routes without token
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is already authenticated and trying to access auth routes
  if (authRoutes.some(route => pathname.startsWith(route)) && token) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
