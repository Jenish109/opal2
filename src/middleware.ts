import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Explicitly define protected routes
const isProtectedRoutes = createRouteMatcher(['/dashboard(.*)', '/payment(.*)'])

// Explicitly define public routes - THIS IS THE KEY ADDITION
const isPublicRoutes = createRouteMatcher([
  '/auth/sign-in(.*)',  // Make sure sign-in routes are public
  '/auth/sign-up(.*)',  // If you have a sign-up route
  '/auth/callback(.*)', // Your auth callback route
  '/'                   // Homepage
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const origin = req.headers.get('origin') ?? ''
  const isAllowedOrigin = allowedOrigins.includes(origin)

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...corsOptions,
    }
    return NextResponse.json({}, { headers: preflightHeaders })
  }

  // Check if this is a public route first
  if (isPublicRoutes(req)) {
    // Allow access to public routes without authentication
  } 
  // Then check if it's a protected route
  else if (isProtectedRoutes(req)) {
    auth().protect()
  }

  // Handle simple requests
  const response = NextResponse.next()

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}