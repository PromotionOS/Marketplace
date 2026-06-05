import Link from 'next/link'

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
  person: PersonData
}

export default function PersonCard({ person }: Props) {
  const initials = (person.full_name ?? person.email)[0].toUpperCase()

  return (
    <Link
      href={`/profile/${person.id}`}
      className="block bg-white rounded-2xl elevation-1 p-5 card-hover animate-fade-up"
    >
      <div className="flex items-center gap-4 mb-4">
        {person.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatar_url} alt={person.full_name ?? ''} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <span className="text-xl font-black text-orange-500">{initials}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 truncate">{person.full_name ?? 'Unknown'}</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {person.team ? `${person.team} · ` : ''}<span className="capitalize">{person.role}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-orange-500">{person.skill_count}</p>
          <p className="text-xs text-gray-400">skills</p>
        </div>
      </div>

      {person.top_skills && person.top_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.top_skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">
              {skill}
            </span>
          ))}
          {person.top_skills.length > 4 && (
            <span className="text-xs text-gray-400 px-2 py-1">+{person.top_skills.length - 4} more</span>
          )}
        </div>
      )}
    </Link>
  )
}
