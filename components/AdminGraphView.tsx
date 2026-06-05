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
