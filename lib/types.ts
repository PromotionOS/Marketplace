export type Role = 'member' | 'reviewer' | 'admin'
export type Level = 'beginner' | 'proficient' | 'expert'
export type Badge = 'none' | 'beginner' | 'proficient' | 'expert'
export type RelationType = 'prerequisite' | 'complements' | 'leads_to' | 'workflow'
export type RequestStatus = 'open' | 'fulfilled' | 'closed'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  team: string | null
  created_at: string
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  level: Level
  tags: string[]
  evidence_urls: string[]
  years_experience: number | null
  last_used_year: number | null
  submitted_by: string
  score: number
  badge: Badge
  created_at: string
  updated_at: string
}

export interface Endorsement {
  id: string
  skill_id: string
  endorsed_by: string
  note: string | null
  created_at: string
}

export interface SkillEdge {
  id: string
  source_id: string
  target_id: string
  relation_type: RelationType
  weight: number
  ai_suggested: boolean
  approved: boolean
  created_at: string
}

export interface SkillRequest {
  id: string
  title: string
  description: string | null
  category: string | null
  requested_by: string
  status: RequestStatus
  created_at: string
}
