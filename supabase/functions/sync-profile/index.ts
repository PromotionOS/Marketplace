import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()

    if (payload.type !== 'user.created') {
      return new Response('ignored', { status: 200 })
    }

    const user = payload.data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email_addresses[0]?.email_address ?? '',
      full_name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || null,
      avatar_url: user.image_url ?? null,
      role: 'member',
    })

    if (error) {
      console.error('profile insert error:', error)
      return new Response('db error', { status: 500 })
    }

    return new Response('ok')
  } catch (e) {
    console.error('sync-profile error:', e)
    return new Response('error', { status: 500 })
  }
})
