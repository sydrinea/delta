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
} from "reactflow";
import "reactflow/dist/style.css";
import { useDeltaStore } from "@/store/deltaStore";

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

  const nodes = useDeltaStore((s) => s.nodes);
  const edges = useDeltaStore((s) => s.edges);
  const startId = useDeltaStore((s) => s.startId);
  const syncFromFlow = useDeltaStore((s) => s.syncFromFlow);

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
    }
  };

  const handleLabelChange = (value: string) => {
    setLabel(value);
    const newEdges = edges.map((e) =>
      e.id === id ? { ...e, data: { ...e.data, label: value } } : e,
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
                  }
                }}
                className="w-16 text-xs text-center bg-transparent border-b border-ctp-surface1 font-mono text-ctp-text focus:outline-none"
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
              className="text-xs font-mono text-ctp-text bg-ctp-mantle/80 px-1.5 py-0.5 rounded cursor-pointer hover:bg-ctp-surface0 transition-colors"
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
      className={`relative w-12 h-12 rounded-full flex items-center justify-center font-mono text-sm transition-colors ${
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
  const storeNodes = useDeltaStore((s) => s.nodes);
  const storeEdges = useDeltaStore((s) => s.edges);
  const startId = useDeltaStore((s) => s.startId);
  const setStartId = useDeltaStore((s) => s.setStartId);
  const syncFromFlow = useDeltaStore((s) => s.syncFromFlow);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const [stateCount, setStateCount] = useState(storeNodes.length);

  useEffect(() => {
    setNodes(storeNodes);
    setEdges(storeEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  const syncNodes = useCallback(
    (newNodes: Node[], overrideStartId: string | null = startId) => {
      syncFromFlow(newNodes, edges, overrideStartId);
    },
    [edges, startId, syncFromFlow],
  );

  const syncEdges = useCallback(
    (newEdges: Edge[]) => {
      syncFromFlow(nodes, newEdges, startId);
    },
    [nodes, startId, syncFromFlow],
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      const nextNodes = applyNodeChanges(changes, nodes);
      const removals = changes.filter((c: any) => c.type === "remove");

      if (removals.length > 0) {
        setStateCount((c) => c - removals.length);
        if (removals.some((r: any) => r.id === startId)) {
          setStartId(null);
          syncNodes(nextNodes, null);
          return;
        }
      }
      syncNodes(nextNodes);
    },
    [onNodesChange, nodes, syncNodes, startId, setStartId],
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      const nextEdges = applyEdgeChanges(changes, edges);
      syncEdges(nextEdges);
    },
    [onEdgesChange, edges, syncEdges],
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
    const id = `q${stateCount}`;
    const newNode: Node = {
      id,
      type: "state",
      position: { x: 100, y: 200 },
      data: { label: id, isAccept: false },
    };
    const newNodes = [...nodes, newNode];
    const newStartId = startId ?? id;
    if (!startId) setStartId(id);
    setStateCount((c) => c + 1);
    syncFromFlow(newNodes, edges, newStartId);
  }, [stateCount, nodes, edges, startId, setStartId, syncFromFlow]);

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
    setStateCount(0);
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
      </div>
    </div>
  );
}
