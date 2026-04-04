'use client'

import type {
  Connection,
  Edge,
  EdgeProps,
  Node,
  NodeProps,
} from 'reactflow'
import { flavors } from '@catppuccin/palette'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BaseEdge,
  ConnectionMode,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
} from 'reactflow'
import { toDot } from '@/lib/dot'
import { themeNames } from '@/lib/theme'
import { useNfaStore } from '@/store/nfaStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { getFlowElementsFromDot } from './layoutNFA'

function AutomataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(data?.label ?? 'a')
  const containerRef = useRef<HTMLDivElement>(null)

  const nodes = useNfaStore(s => s.nodes)
  const edges = useNfaStore(s => s.edges)
  const startId = useNfaStore(s => s.startId)
  const syncFromFlow = useNfaStore(s => s.syncFromFlow)

  const { resolvedTheme } = useTheme()

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const updateEdges = () => {
    const newEdges = edges.map(e =>
      e.id === id ? { ...e, data: { ...e.data, label } } : e,
    )
    syncFromFlow(nodes, newEdges, startId)
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Element)) {
      setEditing(false)
      updateEdges()
    }
  }

  const handleLabelChange = (value: string) => {
    setLabel(value)
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: flavors[themeNames[resolvedTheme ?? 'light']].colors.text.hex,
          strokeWidth: 1.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: editing ? 1000 : 1,
          }}
          className="nodrag nopan"
        >
          {editing
            ? (
                <div
                  ref={containerRef}
                  onBlur={handleBlur}
                  className="flex flex-col gap-1 bg-ctp-base border border-ctp-surface1 rounded p-1"
                >
                  <Input
                    autoFocus
                    value={label}
                    onChange={e => handleLabelChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditing(false)
                        updateEdges()
                      }
                    }}
                    className="h-6 w-16 border-0 bg-transparent px-1 text-center text-xs text-ctp-text focus-visible:ring-0"
                  />
                </div>
              )
            : (
                <span
                  onDoubleClick={() => setEditing(true)}
                  className="text-xs text-ctp-text bg-ctp-mantle/80 px-1.5 py-0.5 rounded cursor-pointer hover:bg-ctp-surface0 transition-colors"
                >
                  {label}
                </span>
              )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function StateNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors ${data.isAccept
        ? 'border-4 border-double border-ctp-text bg-ctp-mantle text-ctp-text'
        : 'border-2 border-ctp-text bg-ctp-mantle text-ctp-text'
      } ${selected ? 'border-ctp-mauve!' : ''}`}
    >
      <Handle
        id="target-top"
        type="source"
        position={Position.Top}
        className="bg-ctp-mauve/45! border-0! w-1! h-1!"
      />
      <Handle
        id="target-left"
        type="source"
        position={Position.Left}
        className="bg-ctp-mauve/45! border-0! w-1! h-1!"
      />
      <span className="relative z-raised">{data.label}</span>
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="bg-ctp-mauve/45! border-0! w-1! h-1!"
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="bg-ctp-mauve/45! border-0! w-1! h-1!"
      />
    </div>
  )
}

const nodeTypes = { state: StateNode }
const edgeTypes = { automata: AutomataEdge }

export function FlowEditor() {
  const machine = useNfaStore(s => s.machine)
  const storeNodes = useNfaStore(s => s.nodes)
  const storeEdges = useNfaStore(s => s.edges)
  const startId = useNfaStore(s => s.startId)
  const patchNfa = useNfaStore(s => s.patch)
  const syncFromFlow = useNfaStore(s => s.syncFromFlow)

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  const [inUseStates, setInUseStates] = useState(
    storeNodes.map((_, index) => index),
  )
  const [hasInitialLayout, setHasInitialLayout] = useState(false)
  const { screenToFlowPosition, getNodes } = useReactFlow()
  const store = useStoreApi()

  const { resolvedTheme } = useTheme()

  const pendingStateRef = useRef<{
    nodes: Node[]
    edges: Edge[]
    startId: string | null
  } | null>(null)
  const isMicrotaskQueuedRef = useRef(false)

  const batchStoreUpdate = useCallback(
    (
      updater: (prev: {
        nodes: Node[]
        edges: Edge[]
        startId: string | null
      }) => {
        nodes: Node[]
        edges: Edge[]
        startId: string | null
      },
    ) => {
      if (!pendingStateRef.current) {
        const state = useNfaStore.getState()
        pendingStateRef.current = {
          nodes: state.nodes,
          edges: state.edges,
          startId: state.startId,
        }
      }

      pendingStateRef.current = updater(pendingStateRef.current)

      if (!isMicrotaskQueuedRef.current) {
        isMicrotaskQueuedRef.current = true
        queueMicrotask(() => {
          if (pendingStateRef.current) {
            syncFromFlow(
              pendingStateRef.current.nodes,
              pendingStateRef.current.edges,
              pendingStateRef.current.startId,
            )
            pendingStateRef.current = null
          }
          isMicrotaskQueuedRef.current = false
        })
      }
    },
    [syncFromFlow],
  )

  useEffect(() => {
    async function initializeLayout() {
      if (machine) {
        const dotString = toDot(machine, themeNames[resolvedTheme ?? 'light'])
        const { nodes: layoutedNodes, edges: layoutedEdges }
          = await getFlowElementsFromDot(dotString)

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        syncFromFlow(layoutedNodes, layoutedEdges, startId)
        setHasInitialLayout(true)
      }
    }

    if (!hasInitialLayout) {
      initializeLayout()
    }
    else {
      setNodes(storeNodes)
      setEdges(storeEdges)
    }
  }, [
    machine,
    storeNodes,
    storeEdges,
    hasInitialLayout,
    setNodes,
    setEdges,
    syncFromFlow,
    startId,
    resolvedTheme,
  ])

  const onNodeDragStop = useCallback(() => {
    const globalState = useNfaStore.getState()
    syncFromFlow(getNodes(), globalState.edges, globalState.startId)
  }, [getNodes, syncFromFlow])

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)

      const removals = changes.filter((c: any) => c.type === 'remove') as any[]

      const requiresStoreSync = changes.some(
        (c: any) => c.type === 'remove' || c.type === 'select',
      )

      if (!requiresStoreSync) {
        return
      }

      if (removals.length) {
        batchStoreUpdate((prev) => {
          const nextNodes = applyNodeChanges(changes, prev.nodes)

          const removedIds = new Set<string>(
            removals.map((r: any) => r.id as string),
          )

          const nextStartId = removedIds.has(prev.startId ?? '')
            ? null
            : prev.startId

          const validEdges = prev.edges.filter(
            e => !removedIds.has(e.source) && !removedIds.has(e.target),
          )

          const removedNums = new Set(
            Array.from(removedIds).map(value =>
              Number.parseInt(value.replace('q', '').trim()),
            ),
          )
          setInUseStates(prev => prev.filter(id => !removedNums.has(id)))

          return { nodes: nextNodes, edges: validEdges, startId: nextStartId }
        })
      }
      else {
        const state = useNfaStore.getState()
        const nextNodes = applyNodeChanges(changes, state.nodes)
        syncFromFlow(nextNodes, state.edges, state.startId)
      }
    },
    [onNodesChange, batchStoreUpdate, syncFromFlow],
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes)

      const removals = changes.filter((c: any) => c.type === 'remove')

      if (removals.length) {
        batchStoreUpdate((prev) => {
          const nextEdges = applyEdgeChanges(changes, prev.edges)
          return { ...prev, edges: nextEdges }
        })
      }
      else {
        const state = useNfaStore.getState()
        const nextEdges = applyEdgeChanges(changes, state.edges)
        syncFromFlow(state.nodes, nextEdges, state.startId)
      }
    },
    [onEdgesChange, batchStoreUpdate, syncFromFlow],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection
      if (!source || !target)
        return

      const newEdge: Edge = {
        ...connection,
        source,
        target,
        type: 'automata',
        data: { label: 'a' },
        id: `edge-${connection.sourceHandle}-${connection.targetHandle}-${Date.now()}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4c4f69' },
      }

      const newEdges = [...edges, newEdge]
      syncFromFlow(nodes, newEdges, startId)
    },
    [nodes, edges, startId, syncFromFlow],
  )

  const addState = useCallback(() => {
    const getCenter = () => {
      const { domNode } = store.getState()
      if (!domNode)
        return { x: 0, y: 0 }

      const rect = domNode.getBoundingClientRect()

      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2

      return screenToFlowPosition({ x: centerX, y: centerY })
    }

    const smallestGap = findSmallestGap(inUseStates)
    const id = `q${smallestGap}`

    const { x: centerX, y: centerY } = getCenter()

    const newNode: Node = {
      id,
      type: 'state',
      position: {
        x: centerX + (smallestGap - 1) * 20,
        y: centerY + (smallestGap - 1) * 20,
      },
      data: { label: id, isAccept: false },
    }

    const newNodes = [...nodes, newNode]
    const newStartId = startId ?? id

    if (!startId)
      patchNfa({ startId: id })

    setInUseStates(prev => [...prev, smallestGap])
    syncFromFlow(newNodes, edges, newStartId)
  }, [inUseStates, nodes, edges, startId, patchNfa, syncFromFlow, screenToFlowPosition, store])

  const toggleAccept = useCallback(() => {
    const newNodes = nodes.map(n =>
      n.selected
        ? { ...n, data: { ...n.data, isAccept: !n.data.isAccept } }
        : n,
    )
    syncFromFlow(newNodes, edges, startId)
  }, [nodes, edges, startId, syncFromFlow])

  const setStart = useCallback(() => {
    const selected = nodes.find(n => n.selected)
    if (!selected)
      return
    syncFromFlow(nodes, edges, selected.id)
  }, [nodes, edges, syncFromFlow])

  const clearGraph = useCallback(() => {
    setInUseStates([])
    syncFromFlow([], [], null)
  }, [syncFromFlow])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-ctp-surface0 shrink-0">
        <Button
          onClick={addState}
          variant="secondary"
          size="xs"
        >
          + state
        </Button>
        <Button
          onClick={toggleAccept}
          variant="secondary"
          size="xs"
        >
          toggle accept
        </Button>
        <Button
          onClick={setStart}
          variant="secondary"
          size="xs"
        >
          set start
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={clearGraph}
            variant="destructive"
            size="xs"
          >
            clear
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {hasInitialLayout && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeDragStop={onNodeDragStop}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionRadius={20}
            connectionMode={ConnectionMode.Loose}
            proOptions={{ hideAttribution: true }}
            fitView
          >
            <Background color="#acb0be" gap={16} size={1} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}

function findSmallestGap(numbers: number[]): number {
  if (numbers.length === 0)
    return 0

  const sorted = [...new Set(numbers)].sort((a, b) => a - b)

  const elementBeforeGap = sorted.find((num, index, arr) => {
    if (index === arr.length - 1)
      return false
    return arr[index + 1] > num + 1
  })

  return elementBeforeGap !== undefined
    ? elementBeforeGap + 1
    : sorted.at(-1)! + 1
}
