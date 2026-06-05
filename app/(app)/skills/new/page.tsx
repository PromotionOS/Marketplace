import Link from 'next/link'
import SkillForm from '@/components/SkillForm'

export default function NewSkillPage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/skills" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
          ← Back to Skills
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">Submit a Skill</h1>
        <p className="text-gray-400 text-sm mt-1">Your score updates live as you fill in the form</p>
      </div>
      <SkillForm />
    </div>
  )
}
