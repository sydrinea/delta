import { instance } from "@viz-js/viz";
import { Node, Edge, MarkerType } from "reactflow";

const NODE_SIZE = 48;

const START_NODE = "__start__";

const HANDLE_MAP = {
  horizontal_positive: {
    source: "source-right",
    target: "target-left",
  },
  horizontal_negative: {
    source: "target-left",
    target: "source-right",
  },
  vertical_positive: {
    source: "source-bottom",
    target: "target-top",
  },
  vertical_negative: {
    source: "target-top",
    target: "source-bottom",
  },
};

interface LayoutEdge {
  _gvid: number;
  tail: number;
  head: number;
  label?: string;
}

interface LayoutObject {
  _gvid: number;
  name: string;
  pos: string;
  shape: string;
}

interface LayoutGraph {
  bb: string;
  bgcolor: string;
  directed: boolean;
  edges: LayoutEdge[];
  name: string;
  objects: LayoutObject[];
  rankdir: string;
  strict: boolean;
}

export async function getFlowElementsFromDot(dotString: string) {
  const viz = await instance();
  const layoutGraph = viz.renderJSON(dotString) as unknown as LayoutGraph;

  const [, , width, height] = layoutGraph["bb"].split(",").map(Number);
  const centerX = width / 2;
  const centerY = height / 2;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const gvidToId = new Map<number, string>();
  const nodePositions = new Map<string, { x: number; y: number }>();

  if (layoutGraph.objects) {
    layoutGraph.objects.forEach((node: LayoutObject) => {
      if (
        node.name === START_NODE ||
        node.name.startsWith("cluster") ||
        !node.pos
      )
        return;

      const [x, y] = node.pos.split(",").map(Number);

      const finalX = x - centerX - NODE_SIZE / 2;
      const finalY = height - y - centerY - NODE_SIZE / 2;

      nodePositions.set(node.name, { x: finalX, y: finalY });

      nodes.push({
        id: node.name,
        type: "state",
        position: {
          x: finalX,
          y: finalY,
        },
        data: {
          label: node.name,
          isAccept: node.shape === "doublecircle",
        },
      });

      gvidToId.set(node._gvid, node.name);
    });
  }

  if (layoutGraph.edges) {
    layoutGraph.edges.forEach((edge: LayoutEdge) => {
      const sourceId = gvidToId.get(edge.tail);
      const targetId = gvidToId.get(edge.head);

      if (!sourceId || !targetId) return;

      const sPos = nodePositions.get(sourceId);
      const tPos = nodePositions.get(targetId);

      let sourceHandle = "source-right";
      let targetHandle = "target-left";

      if (sPos && tPos) {
        if (sourceId === targetId) {
          sourceHandle = "source-right";
          targetHandle = "target-top";
        } else {
          const dx = tPos.x - sPos.x;
          const dy = tPos.y - sPos.y;
          const axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
          const direction =
            (axis === "horizontal" ? dx : dy) > 0 ? "positive" : "negative";
          sourceHandle = HANDLE_MAP[`${axis}_${direction}`].source;
          targetHandle = HANDLE_MAP[`${axis}_${direction}`].target;
        }
      }

      edges.push({
        id: `edge-${sourceId}-${targetId}-${edge._gvid}`,
        source: sourceId,
        target: targetId,
        type: "automata",
        sourceHandle,
        targetHandle,
        data: { label: edge.label || "ε" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4c4f69" },
      });
    });
  }

  return { nodes, edges };
}
