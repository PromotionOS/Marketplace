import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') ?? headersList.get('next-url') ?? ''

  if (userId && !pathname.includes('/onboarding')) {
    try {
      const supabase = await createSupabaseClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, team')
        .eq('id', userId)
        .maybeSingle()

      if (profile && !profile.team) {
        redirect('/onboarding')
      }
    } catch {
      // Supabase unavailable — don't block the app
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-up">
        {children}
      </main>
    </div>
  )
}
