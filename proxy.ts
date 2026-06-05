import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher(['/sign-in(.*)', '/unauthorized'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect()
    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress ?? ''
    if (!email.endsWith('@zopsmart.com')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
})

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
