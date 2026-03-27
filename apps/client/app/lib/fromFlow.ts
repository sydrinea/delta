import type { Node, Edge } from "reactflow";
import { EPSILON } from "@delta/build";

export function flowToCode(
  nodes: Node[],
  edges: Edge[],
  startId: string | null,
): string {
  if (nodes.length === 0) {
    return [
      `import * as Delta from "delta:lib";`,
      ``,
      `const machine = Delta.epsilon();`,
      ``,
      `export default machine;`,
    ].join("\n");
  }

  const stateNames = nodes.map((n) => JSON.stringify(n.id));
  const acceptStates = nodes
    .filter((n) => n.data?.isAccept)
    .map((n) => JSON.stringify(n.id));

  const alphabet = [
    ...new Set(
      edges
        .flatMap((e) => (e.data?.label ?? "a").split(","))
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s !== EPSILON),
    ),
  ];

  const lines = [
    `import * as Delta from "delta:lib";`,
    ``,
    `const machine = Delta.nfa("machine")`,
  ];

  if (alphabet.length > 0) {
    lines.push(
      `  .alphabet(${alphabet.map((s) => JSON.stringify(s)).join(", ")})`,
    );
  }

  if (stateNames.length > 0) {
    lines.push(`  .states(${stateNames.join(", ")})`);
  }

  if (startId) {
    lines.push(`  .start(${JSON.stringify(startId)})`);
  }

  if (acceptStates.length > 0) {
    lines.push(`  .accept(${acceptStates.join(", ")})`);
  }

  edges.forEach((e) => {
    const rawLabel = e.data?.label ?? "a";
    const symbols = rawLabel
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    if (symbols.length === 0) {
      symbols.push("a");
    }

    symbols.forEach((symbol: string) => {
      lines.push(
        `  .transition(${JSON.stringify(e.source)}, ${JSON.stringify(
          symbol,
        )}, ${JSON.stringify(e.target)})`,
      );
    });
  });

  lines.push(`  .build();`);
  lines.push(``);
  lines.push(`export default machine;`);

  return lines.join("\n");
}
