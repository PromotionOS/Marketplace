import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const headersList = await headers()
  const svix_id = headersList.get('svix-id')
  const svix_timestamp = headersList.get('svix-timestamp')
  const svix_signature = headersList.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await req.text()
  const wh = new Webhook(secret)

  let evt: { type: string; data: Record<string, unknown> }

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as typeof evt
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type !== 'user.created') {
    return NextResponse.json({ message: 'ignored' })
  }

  const user = evt.data as {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email_addresses[0]?.email_address ?? '',
    full_name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || null,
    avatar_url: user.image_url ?? null,
    role: 'member',
  })

  if (error) {
    console.error('Webhook profile insert error:', error)
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
  }

  return NextResponse.json({ message: 'ok' })
}
