import type { Node, Edge } from "reactflow";

export function flowToCode(
  nodes: Node[],
  edges: Edge[],
  startId: string,
): string {
  const acceptStates = nodes
    .filter((n) => n.data.isAccept)
    .map((n) => JSON.stringify(n.id));

  const stateNames = nodes.map((n) => JSON.stringify(n.id));

  const alphabet = [...new Set(edges.map((e) => e.data?.label ?? "a"))];

  const transitions = edges.map(
    (e) =>
      `  .transition(${JSON.stringify(e.source)}, ${JSON.stringify(e.data?.label ?? "a")}, ${JSON.stringify(e.target)})`,
  );

  return [
    `import * as Delta from "delta:lib";`,
    ``,
    `const machine = Delta.nfa("machine")`,
    `  .alphabet(${alphabet.map((s) => JSON.stringify(s)).join(", ")})`,
    `  .states(${stateNames.join(", ")})`,
    `  .start(${JSON.stringify(startId)})`,
    `  .accept(${acceptStates.join(", ")})`,
    ...transitions,
    `  .build();`,
    ``,
    `export default machine;`,
  ].join("\n");
}
