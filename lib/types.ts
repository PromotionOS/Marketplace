export type Role = 'member' | 'reviewer' | 'admin'
export type Level = 'beginner' | 'proficient' | 'expert'
export type Badge = 'none' | 'beginner' | 'proficient' | 'expert'
export type RelationType = 'prerequisite' | 'complements' | 'leads_to' | 'workflow'
export type RequestStatus = 'open' | 'fulfilled' | 'closed'
export type EvidenceType = 'github_pr' | 'github_repo' | 'certificate' | 'article' | 'shipped_product' | 'other'
export type ProficiencyAnchor = 'follow_tutorials' | 'build_independently' | 'architect_and_mentor'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  team: string | null
  team_id: string | null
  created_at: string
  updated_at: string | null
}

export interface Team {
  id: string
  name: string
  department: string | null
  created_at: string
}

export interface SkillTaxonomy {
  id: string
  name: string
  category: string
  subcategory: string | null
  aliases: string[]
  description: string | null
}

export interface SkillEvidence {
  id: string
  skill_id: string
  url: string
  evidence_type: EvidenceType
  title: string | null
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
  taxonomy_id: string | null
  proficiency_anchor: ProficiencyAnchor | null
  is_primary: boolean
  available_to_mentor: boolean
  context: string | null
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
