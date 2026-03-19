import type { Node, Edge } from "reactflow";

export function flowToCode(
  nodes: Node[],
  edges: Edge[],
  startId: string,
): string {
  const acceptStates = nodes
    .filter((n) => n.data.isAccept)
    .map((n) => `"${n.id}"`);

  const stateNames = nodes.map((n) => `"${n.id}"`);

  const alphabet = [...new Set(edges.map((e) => e.data?.label ?? "a"))];

  const transitions = edges.map(
    (e) =>
      `  .transition("${e.source}", "${e.data?.label ?? "a"}", "${e.target}")`,
  );

  return [
    `const machine = Delta.nfa("machine")`,
    `  .alphabet(${alphabet.map((s) => `"${s}"`).join(", ")})`,
    `  .states(${stateNames.join(", ")})`,
    `  .start("${startId}")`,
    `  .accept(${acceptStates.join(", ")})`,
    ...transitions,
    `  .build();`,
  ].join("\n");
}
