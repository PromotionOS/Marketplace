import { Suspense } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import PersonCard from '@/components/PersonCard'

interface PersonData {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: string
  team: string | null
  skill_count: number
  top_skills: string[] | null
}

interface Props {
  searchParams: Promise<{ q?: string; team?: string; skill?: string }>
}

async function PeopleList({ searchParams }: Props) {
  const { q, team, skill } = await searchParams
  const supabase = await createSupabaseClient()

  const { data: people } = await supabase.rpc('search_people', {
    query: q ?? '',
    team_filter: team ?? null,
    skill_filter: skill ?? null,
  })

  return (
    <>
      {(people?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👤</p>
          <p className="text-gray-400 font-medium">No people found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {(people as PersonData[]).map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </>
  )
}

export default function PeoplePage({ searchParams }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">People</h1>
          <p className="text-gray-400 text-sm mt-1">Find teammates by name or skill</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl elevation-1 p-5 h-32 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-orange-50 rounded-full w-16" />
                <div className="h-6 bg-orange-50 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      }>
        <PeopleList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
