import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function createSupabaseClient() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'supabase' })
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
