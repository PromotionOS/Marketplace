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
  const cols = Math.ceil(Math.sqrt(skills.length || 1))
  return skills.map((s, i) => {
    const size = 40 + Math.min(s.holder_count * 8, 40)
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
    <div className="flex h-full relative">
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
              <span className="text-xs text-gray-400">{selectedSkill.holder_count} {selectedSkill.holder_count === 1 ? 'person has' : 'people have'} this</span>
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
