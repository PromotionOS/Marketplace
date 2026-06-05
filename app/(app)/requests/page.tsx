import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { SkillRequest, Profile } from '@/lib/types'

export default async function RequestsPage() {
  const supabase = await createSupabaseClient()
  const { data: requests } = await supabase
    .from('skill_requests')
    .select('*, profiles:requested_by(full_name, avatar_url)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  type RequestWithProfile = SkillRequest & { profiles: Pick<Profile, 'full_name' | 'avatar_url'> }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Skill Requests</h1>
          <p className="text-gray-400 text-sm mt-1">Skills the org needs — step up and claim one</p>
        </div>
        <Link href="/requests/new"
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all elevation-1">
          + Post Request
        </Link>
      </div>

      {(requests?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-400 font-medium">No open requests. Post one!</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {(requests as RequestWithProfile[]).map((r) => (
            <div key={r.id} className="bg-white rounded-2xl elevation-1 p-5 card-hover animate-fade-up">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{r.title}</h3>
                  {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {r.category && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                        {r.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      by {r.profiles?.full_name ?? 'Unknown'} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-semibold shrink-0">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
