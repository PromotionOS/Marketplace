import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { team } = await req.json()
  if (!team) return NextResponse.json({ error: 'Team required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ team })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
