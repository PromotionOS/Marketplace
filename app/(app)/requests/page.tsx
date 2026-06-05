import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { SkillRequest, Profile } from '@/lib/types'

export default async function RequestsPage() {
  const supabase = await createSupabaseClient()
  const { data: requests } = await supabase
    .from('skill_requests')
    .select('*, profiles:requested_by(full_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  type RequestWithProfile = SkillRequest & { profiles: Pick<Profile, 'full_name'> }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Skill Requests</h1>
        <Link
          href="/requests/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          + Post Request
        </Link>
      </div>

      {(requests?.length ?? 0) === 0 ? (
        <p className="text-center text-gray-400 py-16">No open requests. Post one!</p>
      ) : (
        <div className="space-y-4">
          {(requests as RequestWithProfile[]).map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {r.category && <span className="mr-2">{r.category}</span>}
                    by {r.profiles?.full_name ?? 'Unknown'} ·{' '}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
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
