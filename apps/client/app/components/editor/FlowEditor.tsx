"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
  Node,
  Edge,
  ConnectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import { useDeltaStore } from "@/store/deltaStore";
import { getFlowElementsFromDot } from "./layoutNFA";
import { toDot } from "@/lib/dot";

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
  const [curvature, setCurvature] = useState(data?.curvature ?? 0.25);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data?.label ?? "a");
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useDeltaStore((s) => s.nfa.nodes);
  const edges = useDeltaStore((s) => s.nfa.edges);
  const startId = useDeltaStore((s) => s.nfa.startId);
  const syncFromFlow = useDeltaStore((s) => s.actions.syncNfaFromFlow);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Element)) {
      setEditing(false);
      updateEdges();
    }
  };

  const handleLabelChange = (value: string) => {
    setLabel(value);
  };

  const updateEdges = () => {
    const newEdges = edges.map((e) =>
      e.id === id ? { ...e, data: { ...e.data, label } } : e,
    );
    syncFromFlow(nodes, newEdges, startId);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: "#4c4f69", strokeWidth: 1.5 }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: editing ? 1000 : 1,
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <div
              ref={containerRef}
              onBlur={handleBlur}
              className="flex flex-col gap-1 bg-ctp-base border border-ctp-surface1 rounded p-1"
            >
              <input
                autoFocus
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditing(false);
                    updateEdges();
                  }
                }}
                className="w-16 text-xs text-center bg-transparent border-b border-ctp-surface1 text-ctp-text focus:outline-none"
              />
              <input
                type="range"
                min="0.25"
                max="1.5"
                step="0.05"
                defaultValue={curvature}
                onMouseUp={(e) =>
                  setCurvature(parseFloat((e.target as HTMLInputElement).value))
                }
                className="w-16"
              />
            </div>
          ) : (
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
  );
}

function StateNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors ${
        data.isAccept
          ? "border-4 border-double border-ctp-text bg-ctp-mantle text-ctp-text"
          : "border-2 border-ctp-text bg-ctp-mantle text-ctp-text"
      } ${selected ? "border-ctp-mauve!" : ""}`}
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
      <span className="relative z-10">{data.label}</span>
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
  );
}

const nodeTypes = { state: StateNode };
const edgeTypes = { automata: AutomataEdge };

export function FlowEditor() {
  const machine = useDeltaStore((s) => s.nfa.machine);
  const storeNodes = useDeltaStore((s) => s.nfa.nodes);
  const storeEdges = useDeltaStore((s) => s.nfa.edges);
  const startId = useDeltaStore((s) => s.nfa.startId);
  const setNfa = useDeltaStore((s) => s.actions.setNfa);
  const syncFromFlow = useDeltaStore((s) => s.actions.syncNfaFromFlow);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const [inUseStates, setInUseStates] = useState(
    storeNodes.map((_, index) => index),
  );
  const [hasInitialLayout, setHasInitialLayout] = useState(false);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const store = useStoreApi();

  const getCenter = () => {
    const { domNode } = store.getState();
    if (!domNode) return { x: 0, y: 0 };

    const rect = domNode.getBoundingClientRect();

    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    return screenToFlowPosition({ x: centerX, y: centerY });
  };

  const pendingStateRef = useRef<{
    nodes: Node[];
    edges: Edge[];
    startId: string | null;
  } | null>(null);
  const isMicrotaskQueued = useRef(false);

  const batchStoreUpdate = useCallback(
    (
      updater: (prev: {
        nodes: Node[];
        edges: Edge[];
        startId: string | null;
      }) => {
        nodes: Node[];
        edges: Edge[];
        startId: string | null;
      },
    ) => {
      if (!pendingStateRef.current) {
        const state = useDeltaStore.getState();
        pendingStateRef.current = {
          nodes: state.nfa.nodes,
          edges: state.nfa.edges,
          startId: state.nfa.startId,
        };
      }

      pendingStateRef.current = updater(pendingStateRef.current);

      if (!isMicrotaskQueued.current) {
        isMicrotaskQueued.current = true;
        queueMicrotask(() => {
          if (pendingStateRef.current) {
            syncFromFlow(
              pendingStateRef.current.nodes,
              pendingStateRef.current.edges,
              pendingStateRef.current.startId,
            );
            pendingStateRef.current = null;
          }
          isMicrotaskQueued.current = false;
        });
      }
    },
    [syncFromFlow],
  );

  useEffect(() => {
    async function initializeLayout() {
      if (machine) {
        const dotString = toDot(machine);
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          await getFlowElementsFromDot(dotString);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        syncFromFlow(layoutedNodes, layoutedEdges, startId);
        setHasInitialLayout(true);
      }
    }

    if (!hasInitialLayout) {
      initializeLayout();
    } else {
      setNodes(storeNodes);
      setEdges(storeEdges);
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
  ]);

  const onNodeDragStop = useCallback(() => {
    const globalState = useDeltaStore.getState();
    syncFromFlow(getNodes(), globalState.nfa.edges, globalState.nfa.startId);
  }, [getNodes, syncFromFlow]);

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);

      const removals = changes.filter((c: any) => c.type === "remove") as any[];

      const requiresStoreSync = changes.some(
        (c: any) => c.type === "remove" || c.type === "select",
      );

      if (!requiresStoreSync) {
        return;
      }

      if (removals.length) {
        batchStoreUpdate((prev) => {
          const nextNodes = applyNodeChanges(changes, prev.nodes);

          const removedIds = new Set<string>(
            removals.map((r: any) => r.id as string),
          );

          const nextStartId = removedIds.has(prev.startId ?? "")
            ? null
            : prev.startId;

          const validEdges = prev.edges.filter(
            (e) => !removedIds.has(e.source) && !removedIds.has(e.target),
          );

          const removedNums = new Set(
            Array.from(removedIds).map((value) =>
              parseInt(value.replace("q", "").trim()),
            ),
          );
          setInUseStates((prev) => prev.filter((id) => !removedNums.has(id)));

          return { nodes: nextNodes, edges: validEdges, startId: nextStartId };
        });
      } else {
        const state = useDeltaStore.getState();
        const nextNodes = applyNodeChanges(changes, state.nfa.nodes);
        syncFromFlow(nextNodes, state.nfa.edges, state.nfa.startId);
      }
    },
    [onNodesChange, batchStoreUpdate, syncFromFlow],
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);

      const removals = changes.filter((c: any) => c.type === "remove");

      if (removals.length) {
        batchStoreUpdate((prev) => {
          const nextEdges = applyEdgeChanges(changes, prev.edges);
          return { ...prev, edges: nextEdges };
        });
      } else {
        const state = useDeltaStore.getState();
        const nextEdges = applyEdgeChanges(changes, state.nfa.edges);
        syncFromFlow(state.nfa.nodes, nextEdges, state.nfa.startId);
      }
    },
    [onEdgesChange, batchStoreUpdate, syncFromFlow],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return;

      const newEdge: Edge = {
        ...connection,
        source,
        target,
        type: "automata",
        data: { label: "a" },
        id: `edge-${connection.sourceHandle}-${connection.targetHandle}-${Date.now()}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4c4f69" },
      };

      const newEdges = [...edges, newEdge];
      syncFromFlow(nodes, newEdges, startId);
    },
    [nodes, edges, startId, syncFromFlow],
  );

  const addState = useCallback(() => {
    const smallestGap = findSmallestGap(inUseStates);
    const id = `q${smallestGap}`;

    const { x: centerX, y: centerY } = getCenter();

    const newNode: Node = {
      id,
      type: "state",
      position: {
        x: centerX + (smallestGap - 1) * 20,
        y: centerY + (smallestGap - 1) * 20,
      },
      data: { label: id, isAccept: false },
    };

    const newNodes = [...nodes, newNode];
    const newStartId = startId ?? id;

    if (!startId) setNfa({ startId: id });

    setInUseStates((prev) => [...prev, smallestGap]);
    syncFromFlow(newNodes, edges, newStartId);
  }, [inUseStates, nodes, edges, startId, setNfa, syncFromFlow]);

  const toggleAccept = useCallback(() => {
    const newNodes = nodes.map((n) =>
      n.selected
        ? { ...n, data: { ...n.data, isAccept: !n.data.isAccept } }
        : n,
    );
    syncFromFlow(newNodes, edges, startId);
  }, [nodes, edges, startId, syncFromFlow]);

  const setStart = useCallback(() => {
    const selected = nodes.find((n) => n.selected);
    if (!selected) return;
    syncFromFlow(nodes, edges, selected.id);
  }, [nodes, edges, syncFromFlow]);

  const clearGraph = useCallback(() => {
    setInUseStates([]);
    syncFromFlow([], [], null);
  }, [syncFromFlow]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-ctp-surface0 shrink-0">
        <button
          onClick={addState}
          className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-surface0 transition-colors"
        >
          + state
        </button>
        <button
          onClick={toggleAccept}
          className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-surface0 transition-colors"
        >
          toggle accept
        </button>
        <button
          onClick={setStart}
          className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-surface0 transition-colors"
        >
          set start
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={clearGraph}
            className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-red hover:bg-ctp-surface0 transition-colors"
          >
            clear
          </button>
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
  );
}

function findSmallestGap(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...new Set(numbers)].sort((a, b) => a - b);

  const elementBeforeGap = sorted.find((num, index, arr) => {
    if (index === arr.length - 1) return false;
    return arr[index + 1] > num + 1;
  });

  return elementBeforeGap !== undefined
    ? elementBeforeGap + 1
    : sorted[sorted.length - 1] + 1;
}
