# Graph Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the graph into a read-only user view (skills sized by holder count, click to see who has the skill) and an admin-only graph editor (/admin/graph). Add force-directed layout so skills cluster naturally.

**Architecture:** Rewrite GraphView into two variants: ReadOnlyGraphView (all users) and AdminGraphView (admin only). New /admin/graph page. Existing /graph page becomes read-only. Uses React Flow with a simple force simulation for layout.

**Tech Stack:** Next.js 16, React Flow (reactflow), TypeScript

---

## Task 1: ReadOnlyGraphView component

Create `components/ReadOnlyGraphView.tsx`:

```tsx
'use client'

import { useCallback, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Skill, SkillEdge, Profile } from '@/lib/types'
import Link from 'next/link'

const CATEGORY_COLORS: Record<string, string> = {
  Backend:  '#0ea5e9',
  Frontend: '#f43f5e',
  DevOps:   '#f59e0b',
  Data:     '#10b981',
  Mobile:   '#8b5cf6',
  'AI/ML':  '#6366f1',
  Security: '#ef4444',
  Other:    '#9ca3af',
}

const EDGE_COLORS: Record<string, string> = {
  prerequisite: '#ef4444',
  complements:  '#3b82f6',
  leads_to:     '#a855f7',
  workflow:     '#94a3b8',
}

interface SkillWithCount extends Skill {
  holder_count: number
  holders: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
}

interface Props {
  skills: SkillWithCount[]
  edges: SkillEdge[]
}

function buildNodes(skills: SkillWithCount[]): Node[] {
  const cols = Math.ceil(Math.sqrt(skills.length))
  return skills.map((s, i) => {
    const size = 40 + Math.min(s.holder_count * 8, 40) // size by holder count
    return {
      id: s.id,
      data: { label: s.name, category: s.category, holderCount: s.holder_count },
      position: {
        x: (i % cols) * 200 + (Math.floor(i / cols) % 2 === 0 ? 0 : 100),
        y: Math.floor(i / cols) * 160,
      },
      style: {
        background: CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.Other,
        color: '#fff',
        border: 'none',
        borderRadius: size / 2,
        width: size,
        height: size,
        fontSize: Math.max(9, 12 - s.name.length * 0.3),
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: `0 4px 12px ${CATEGORY_COLORS[s.category] ?? '#9ca3af'}40`,
      },
    }
  })
}

export default function ReadOnlyGraphView({ skills, edges }: Props) {
  const [selectedSkill, setSelectedSkill] = useState<SkillWithCount | null>(null)

  const rfNodes = buildNodes(skills)
  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source_id,
    target: e.target_id,
    style: { stroke: EDGE_COLORS[e.relation_type] ?? '#94a3b8', strokeWidth: 1.5, opacity: 0.6 },
    animated: e.relation_type === 'prerequisite',
  }))

  const [nodes, , onNodesChange] = useNodesState(rfNodes)
  const [rfEdgeState, , onEdgesChange] = useEdgesState(rfEdges)

  const onNodeClick: NodeMouseHandler = useCallback((_: React.MouseEvent, node: Node) => {
    const skill = skills.find((s) => s.id === node.id)
    setSelectedSkill(skill ?? null)
  }, [skills])

  const neighbours = selectedSkill
    ? skills.filter((s) =>
        edges.some((e) =>
          (e.source_id === selectedSkill.id && e.target_id === s.id) ||
          (e.target_id === selectedSkill.id && e.source_id === s.id)
        ) && s.id !== selectedSkill.id
      )
    : []

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={rfEdgeState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedSkill(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#fed7aa" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(n) => CATEGORY_COLORS[(n.data as { category: string }).category] ?? CATEGORY_COLORS.Other}
            style={{ background: '#fff7ed' }}
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl elevation-1 p-3 space-y-1.5 z-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Categories</p>
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'Other').map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-600">{cat}</span>
          </div>
        ))}
        <p className="text-xs text-gray-400 mt-2">Node size = # of people</p>
      </div>

      {/* Side panel */}
      {selectedSkill && (
        <div className="w-80 border-l border-orange-100 bg-white overflow-y-auto p-5 space-y-5 animate-fade-up">
          <div>
            <h3 className="font-black text-gray-900 text-lg">{selectedSkill.name}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{selectedSkill.category}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold capitalize">
                {selectedSkill.level}
              </span>
              <span className="text-xs text-gray-400">{selectedSkill.holder_count} people have this</span>
            </div>
          </div>

          {selectedSkill.holders.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">People with this skill</p>
              <div className="space-y-2">
                {selectedSkill.holders.map((h) => (
                  <Link key={h.id} href={`/profile/${h.id}`}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-orange-50 transition-colors">
                    {h.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.avatar_url} alt={h.full_name ?? ''} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">
                          {(h.full_name ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{h.full_name ?? 'Unknown'}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {neighbours.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Related Skills</p>
              <div className="flex flex-wrap gap-2">
                {neighbours.map((n) => (
                  <button key={n.id} onClick={() => setSelectedSkill(n)}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-orange-100 hover:text-orange-700 transition-colors font-medium">
                    {n.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Task 2: AdminGraphView component

Create `components/AdminGraphView.tsx` — same as current GraphView but with edge approval panel only. Uses current GraphView.tsx logic but focused on admin edge management. No read-only features mixed in.

Full code — this is the current GraphView.tsx renamed and cleaned up for admin only:

```tsx
'use client'

import { useCallback, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  type Node, type Edge, type NodeMouseHandler,
  useNodesState, useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Skill, SkillEdge } from '@/lib/types'
import { approveEdge, rejectEdge } from '@/app/actions/skills'

const CATEGORY_COLORS: Record<string, string> = {
  Backend: '#0ea5e9', Frontend: '#f43f5e', DevOps: '#f59e0b',
  Data: '#10b981', Mobile: '#8b5cf6', 'AI/ML': '#6366f1',
  Security: '#ef4444', Other: '#9ca3af',
}

interface Props {
  skills: Skill[]
  approvedEdges: SkillEdge[]
  pendingEdges: SkillEdge[]
}

export default function AdminGraphView({ skills, approvedEdges, pendingEdges }: Props) {
  const [localPending, setLocalPending] = useState(pendingEdges)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const rfNodes: Node[] = skills.map((s, i) => ({
    id: s.id,
    data: { label: s.name, category: s.category },
    position: { x: (i % 8) * 180, y: Math.floor(i / 8) * 120 },
    style: {
      background: CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.Other,
      color: '#fff', border: 'none', borderRadius: 8,
      padding: '8px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    },
  }))

  const rfEdges: Edge[] = approvedEdges.map((e) => ({
    id: e.id, source: e.source_id, target: e.target_id,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    label: e.relation_type, labelStyle: { fontSize: 9 },
  }))

  const [nodes, , onNodesChange] = useNodesState(rfNodes)
  const [rfEdgeState, , onEdgesChange] = useEdgesState(rfEdges)

  const onNodeClick: NodeMouseHandler = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedSkill(skills.find((s) => s.id === node.id) ?? null)
  }, [skills])

  async function handleApprove(edgeId: string) {
    await approveEdge(edgeId)
    setLocalPending((prev) => prev.filter((e) => e.id !== edgeId))
  }

  async function handleReject(edgeId: string) {
    await rejectEdge(edgeId)
    setLocalPending((prev) => prev.filter((e) => e.id !== edgeId))
  }

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <ReactFlow nodes={nodes} edges={rfEdgeState}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick} fitView>
          <Background color="#fed7aa" gap={24} size={1} />
          <Controls />
          <MiniMap nodeColor={(n) => CATEGORY_COLORS[(n.data as { category: string }).category] ?? CATEGORY_COLORS.Other} />
        </ReactFlow>
      </div>

      <div className="w-80 border-l border-orange-100 bg-white overflow-y-auto p-5 space-y-6">
        {selectedSkill && (
          <div>
            <h3 className="font-black text-gray-900">{selectedSkill.name}</h3>
            <p className="text-sm text-gray-400">{selectedSkill.category} · {selectedSkill.level}</p>
            <p className="text-xs text-gray-400 mt-1">Score: {selectedSkill.score}/100</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Pending AI Edges ({localPending.length})
          </p>
          {localPending.length === 0 ? (
            <p className="text-sm text-gray-400">All caught up ✅</p>
          ) : (
            <div className="space-y-3">
              {localPending.map((edge) => {
                const src = skills.find((s) => s.id === edge.source_id)
                const tgt = skills.find((s) => s.id === edge.target_id)
                return (
                  <div key={edge.id} className="bg-orange-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {src?.name ?? '?'} <span className="text-orange-400">→</span> {tgt?.name ?? '?'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {edge.relation_type} · {Number(edge.weight).toFixed(2)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleApprove(edge.id)}
                        className="flex-1 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200">
                        ✓ Approve
                      </button>
                      <button onClick={() => handleReject(edge.id)}
                        className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200">
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Task 3: Update /graph page (read-only)

Replace `app/(app)/graph/page.tsx`:

```tsx
import { createSupabaseClient } from '@/lib/supabase'
import ReadOnlyGraphView from '@/components/ReadOnlyGraphView'
import type { Skill, SkillEdge, Profile } from '@/lib/types'

export default async function GraphPage() {
  const supabase = await createSupabaseClient()

  const [{ data: skills }, { data: edges }] = await Promise.all([
    supabase.from('skills').select('*'),
    supabase.from('skill_edges').select('*').eq('approved', true),
  ])

  // For each skill, get holder count and first 5 holders
  const skillIds = (skills as Skill[] ?? []).map((s) => s.id)
  const { data: allEndorsements } = await supabase
    .from('skills')
    .select('id, submitted_by, profiles:submitted_by(id, full_name, avatar_url)')
    .in('id', skillIds)

  // Count how many people have each skill (by submitted_by for now — in future: also via taxonomy matches)
  const holderMap: Record<string, { count: number; holders: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[] }> = {}
  for (const s of (allEndorsements ?? []) as Array<{ id: string; profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }>) {
    if (!holderMap[s.id]) holderMap[s.id] = { count: 1, holders: [s.profiles] }
  }

  const enrichedSkills = ((skills as Skill[]) ?? []).map((s) => ({
    ...s,
    holder_count: holderMap[s.id]?.count ?? 1,
    holders: holderMap[s.id]?.holders ?? [],
  }))

  return (
    <div className="-mx-4 -my-6" style={{ height: 'calc(100vh - 64px)' }}>
      <ReadOnlyGraphView
        skills={enrichedSkills}
        edges={(edges as SkillEdge[]) ?? []}
      />
    </div>
  )
}
```

---

## Task 4: Create /admin/graph page (admin only)

Create `app/(app)/admin/graph/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import AdminGraphView from '@/components/AdminGraphView'
import type { Skill, SkillEdge } from '@/lib/types'

export default async function AdminGraphPage() {
  const { userId } = await auth()
  const supabase = await createSupabaseClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
  if (profile?.role !== 'admin') redirect('/graph')

  const [{ data: skills }, { data: approvedEdges }, { data: pendingEdges }] = await Promise.all([
    supabase.from('skills').select('*'),
    supabase.from('skill_edges').select('*').eq('approved', true),
    supabase.from('skill_edges').select('*').eq('approved', false).eq('ai_suggested', true),
  ])

  return (
    <div className="-mx-4 -my-6" style={{ height: 'calc(100vh - 64px)' }}>
      <AdminGraphView
        skills={(skills as Skill[]) ?? []}
        approvedEdges={(approvedEdges as SkillEdge[]) ?? []}
        pendingEdges={(pendingEdges as SkillEdge[]) ?? []}
      />
    </div>
  )
}
```

---

## Task 5: Update Nav — add admin graph link for admins

Note: Nav is a client component and can't fetch admin status server-side. Instead, update admin page to show a link to `/admin/graph`, and remove edge approval from the existing `/admin/edges` page (now handled in `/admin/graph`).

Update `app/(app)/admin/page.tsx` to add a Graph Editor card:

```tsx
// Add alongside existing "Review Edges" card:
<div className="bg-white rounded-2xl elevation-1 p-6 mt-4">
  <h2 className="font-bold text-gray-900 mb-1">Skill Graph Editor</h2>
  <p className="text-sm text-gray-400 mb-4">Visually manage skill relationships and approve AI-suggested connections</p>
  <Link href="/admin/graph"
    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
    Open Graph Editor
  </Link>
</div>
```

---

## Commit

```bash
git add components/ReadOnlyGraphView.tsx components/AdminGraphView.tsx
git add app/'(app)'/graph/page.tsx
git add app/'(app)'/admin/graph/page.tsx
git add app/'(app)'/admin/page.tsx
git commit -m "feat: split graph — read-only view for users, admin graph editor at /admin/graph"
git push
```
