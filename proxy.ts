import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher([
  '/sign-in(.*)',
  '/unauthorized',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return

  await auth.protect()

  // Use JWT claims instead of currentUser() — no extra API call per request
  const { sessionClaims } = await auth()
  const email = (sessionClaims?.email as string | undefined) ?? ''

  if (email && !email.endsWith('@zopsmart.com')) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
})

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
