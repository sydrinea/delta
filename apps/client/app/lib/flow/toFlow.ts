import type { Node, Edge } from "reactflow";
import { EPSILON, NFA } from "@delta/build";
import { MarkerType } from "reactflow";

export function nfaToFlow(nfa: NFA): { nodes: Node[]; edges: Edge[] } {
  const stateList = [...nfa.states];

  const nodes: Node[] = stateList.map((state, i) => ({
    id: state,
    type: "state",
    position: { x: 100 + i * 150, y: 200 },
    data: {
      label: state,
      isAccept: nfa.acceptStates.has(state),
      isStart: state === nfa.startState,
    },
  }));

  const edges: Edge[] = [...nfa.transitions.entries()].flatMap(
    ([from, symbolMap]) =>
      [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
        [...toSet].map((to) => ({
          id: `${from}-${symbol}-${to}`,
          source: from,
          target: to,
          type: "automata",
          data: { label: symbol === EPSILON ? "ε" : symbol },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#4c4f69" },
        })),
      ),
  );

  return { nodes, edges };
}
