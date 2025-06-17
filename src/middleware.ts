import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const protectedRoutes = [
  '/settings/openai',
  '/api/user/openai-key',
  '/api/user/usage-stats',
]

// Routes that should redirect to login
const authRequiredRoutes = [
  '/settings/openai',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // For pages, redirect to settings (login page)
      if (authRequiredRoutes.some(route => pathname.startsWith(route))) {
        const url = new URL('/settings', request.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/settings/openai',
    '/api/user/:path*',
  ]
}