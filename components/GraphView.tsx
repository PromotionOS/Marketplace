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
import type { Skill, SkillEdge } from '@/lib/types'
import { approveEdge, rejectEdge } from '@/app/actions/skills'

const CATEGORY_COLORS: Record<string, string> = {
  Backend: '#f97316',
  Frontend: '#f43f5e',
  DevOps: '#f59e0b',
  Data: '#10b981',
  default: '#9ca3af',
}

const EDGE_COLORS: Record<string, string> = {
  prerequisite: '#ef4444',
  complements: '#3b82f6',
  leads_to: '#a855f7',
  workflow: '#64748b',
}

interface Props {
  skills: Skill[]
  edges: SkillEdge[]
  pendingEdges?: SkillEdge[]
  isAdmin?: boolean
}

export default function GraphView({ skills, edges, pendingEdges = [], isAdmin = false }: Props) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [localPending, setLocalPending] = useState(pendingEdges)

  const rfNodes: Node[] = skills.map((s, i) => ({
    id: s.id,
    data: { label: s.name, category: s.category, badge: s.badge, score: s.score },
    position: {
      x: (i % 8) * 180,
      y: Math.floor(i / 8) * 120,
    },
    style: {
      background: CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.default,
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    },
  }))

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source_id,
    target: e.target_id,
    style: { stroke: EDGE_COLORS[e.relation_type] ?? '#64748b', strokeWidth: 1.5 },
    label: e.relation_type,
    labelStyle: { fontSize: 10 },
  }))

  const [nodes, , onNodesChange] = useNodesState(rfNodes)
  const [rfEdgeState, , onEdgesChange] = useEdgesState(rfEdges)

  const onNodeClick: NodeMouseHandler = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const skill = skills.find((s) => s.id === node.id)
      setSelectedSkill(skill ?? null)
    },
    [skills]
  )

  async function handleApprove(edgeId: string) {
    await approveEdge(edgeId)
    setLocalPending((prev) => prev.filter((e) => e.id !== edgeId))
  }

  async function handleReject(edgeId: string) {
    await rejectEdge(edgeId)
    setLocalPending((prev) => prev.filter((e) => e.id !== edgeId))
  }

  const neighbourIds = selectedSkill
    ? edges
        .filter((e) => e.source_id === selectedSkill.id || e.target_id === selectedSkill.id)
        .flatMap((e) => [e.source_id, e.target_id])
    : []

  const neighbours = skills.filter(
    (s) => neighbourIds.includes(s.id) && s.id !== selectedSkill?.id
  )

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={rfEdgeState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(n: Node) =>
              CATEGORY_COLORS[(n.data as { category: string }).category] ?? CATEGORY_COLORS.default
            }
          />
        </ReactFlow>
      </div>

      {(selectedSkill || (isAdmin && localPending.length > 0)) && (
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto p-4 space-y-6">
          {selectedSkill && (
            <div>
              <h3 className="font-semibold text-gray-900">{selectedSkill.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedSkill.category} · {selectedSkill.level}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full capitalize">
                  {selectedSkill.badge}
                </span>
                <span className="text-xs text-gray-500">Score: {selectedSkill.score}</span>
              </div>
              {neighbours.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Connected Skills</p>
                  <ul className="space-y-1">
                    {neighbours.map((n) => (
                      <li
                        key={n.id}
                        className="text-sm text-gray-700 cursor-pointer hover:text-orange-600"
                        onClick={() => setSelectedSkill(n)}
                      >
                        {n.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {isAdmin && localPending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pending AI Edges ({localPending.length})
              </p>
              <div className="space-y-3">
                {localPending.map((edge) => {
                  const src = skills.find((s) => s.id === edge.source_id)
                  const tgt = skills.find((s) => s.id === edge.target_id)
                  return (
                    <div key={edge.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-700">
                        {src?.name ?? '?'} → {tgt?.name ?? '?'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {edge.relation_type} · weight {edge.weight.toFixed(2)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApprove(edge.id)}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(edge.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
