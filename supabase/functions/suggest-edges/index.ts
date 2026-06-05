import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const embedRes = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text-v1_5',
        input: `${record.name}: ${record.description}`,
      }),
    })

    if (!embedRes.ok) {
      const err = await embedRes.text()
      console.error('Groq embedding error:', err)
      return new Response('embedding failed', { status: 500 })
    }

    const { data: [{ embedding }] } = await embedRes.json()

    await supabase.from('skills').update({ embedding }).eq('id', record.id)

    const { data: neighbours } = await supabase.rpc('match_skills', {
      query_embedding: embedding,
      match_threshold: 0.80,
      match_count: 5,
      exclude_id: record.id,
    })

    for (const n of neighbours ?? []) {
      await supabase.from('skill_edges').upsert(
        {
          source_id: record.id,
          target_id: n.id,
          relation_type: 'workflow',
          weight: n.similarity,
          ai_suggested: true,
          approved: false,
        },
        { onConflict: 'source_id,target_id' }
      )
    }

    return new Response('ok')
  } catch (e) {
    console.error('suggest-edges error:', e)
    return new Response('error', { status: 500 })
  }
})
