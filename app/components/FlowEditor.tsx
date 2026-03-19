"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  addEdge,
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
} from "reactflow";
import "reactflow/dist/style.css";
import { useDelta } from "@/context/DeltaContext";
import { flowToCode } from "@/lib/compiler/fromFlow";
import { runCode } from "../runCode";

const SetEdgesContext = createContext<
  ((updater: (eds: Edge[]) => Edge[]) => void) | null
>(null);

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
  const setEdges = useContext(SetEdgesContext);

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
    setEdges?.((eds) =>
      eds.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label: value } } : e,
      ),
    );
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
        type="target"
        position={Position.Top}
        className="bg-ctp-mauve/45! border-0! w-1! h-1!"
      />
      <Handle
        id="target-left"
        type="target"
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
  const {
    nodes: ctxNodes,
    setNodes: setCtxNodes,
    edges: ctxEdges,
    setEdges: setCtxEdges,
    startId,
    setStartId,
    setEditorValue,
    setAnf,
    setEditorError,
  } = useDelta();

  const [nodes, setNodes, onNodesChange] = useNodesState(ctxNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(ctxEdges);
  const [stateCount, setStateCount] = useState(ctxNodes.length);
  const [synced, setSynced] = useState(false);

  const syncToEditor = useCallback(() => {
    if (nodes.length > 0 && startId) {
      const code = flowToCode(nodes, edges, startId);
      setEditorValue(code);
      setCtxNodes(nodes);
      setCtxEdges(edges);
      setSynced(true);
      runCode(code, setAnf, setEditorError);
      setTimeout(() => setSynced(false), 2000);
    }
  }, [nodes, edges, startId, setEditorValue, setCtxNodes, setCtxEdges]);

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: "automata",
        data: {
          label: "a",
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4c4f69" },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const addState = useCallback(() => {
    const id = `q${stateCount}`;
    const newNode: Node = {
      id,
      type: "state",
      position: { x: 100 + stateCount * 150, y: 200 },
      data: { label: id, isAccept: false },
    };
    setNodes((nds) => [...nds, newNode]);
    if (!startId) setStartId(id);
    setStateCount((c) => c + 1);
  }, [stateCount, setNodes, startId, setStartId]);

  const toggleAccept = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.selected
          ? { ...n, data: { ...n.data, isAccept: !n.data.isAccept } }
          : n,
      ),
    );
  }, [setNodes]);

  const setStart = useCallback(() => {
    const selected = nodes.find((n) => n.selected);
    if (selected) setStartId(selected.id);
  }, [nodes, setStartId]);

  return (
    <SetEdgesContext.Provider value={setEdges}>
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
              onClick={syncToEditor}
              disabled={nodes.length === 0 || !startId}
              className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-surface0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {synced ? "✓ synced" : "sync to editor"}
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
            connectionRadius={30}
            proOptions={{ hideAttribution: true }}
            fitView
          >
            <Background color="#acb0be" gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>
    </SetEdgesContext.Provider>
  );
}
