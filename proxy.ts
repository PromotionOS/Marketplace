import { clerkMiddleware, clerkClient, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher([
  '/sign-in(.*)',
  '/unauthorized',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect()
    const { userId } = await auth()
    if (userId) {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const email = user.emailAddresses[0]?.emailAddress ?? ''
      if (!email.endsWith('@zopsmart.com')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
