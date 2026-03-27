import { describe, it, expect } from "vitest";
import { flowToCode } from "@/lib/compiler/fromFlow";
import type { Node, Edge } from "reactflow";

describe("fromFlow", () => {
  it("handles empty flow", () => {
    const code = flowToCode([], [], null);
    expect(code).toContain("const machine = Delta.epsilon();");
  });

  it("generates NFA code successfully for basic nodes and edges", () => {
    const nodes: Node[] = [
      {
        id: "q0",
        type: "state",
        data: { isAccept: false },
        position: { x: 0, y: 0 },
      },
      {
        id: "q1",
        type: "state",
        data: { isAccept: true },
        position: { x: 0, y: 0 },
      },
    ];

    const edges: Edge[] = [
      { id: "e1", source: "q0", target: "q1", data: { label: "a,b" } },
      { id: "e2", source: "q0", target: "q0", data: { label: "c" } },
    ];

    const code = flowToCode(nodes, edges, "q0");

    expect(code).toContain('import * as Delta from "delta:lib";');
    expect(code).toContain('const machine = Delta.nfa("machine")');
    expect(code).toContain('.alphabet("a", "b", "c")');
    expect(code).toContain('.states("q0", "q1")');
    expect(code).toContain('.start("q0")');
    expect(code).toContain('.accept("q1")');
    expect(code).toContain('.transition("q0", "a", "q1")');
    expect(code).toContain('.transition("q0", "b", "q1")');
    expect(code).toContain('.transition("q0", "c", "q0")');
    expect(code).toContain(".build();");
    expect(code).toContain("export default machine;");
  });

  it("handles empty edge labels by defaulting to 'a'", () => {
    const nodes: Node[] = [
      { id: "q0", type: "state", position: { x: 0, y: 0 }, data: {} },
      { id: "q1", type: "state", position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "q0", target: "q1", data: {} }, // missing label
    ];
    const code = flowToCode(nodes, edges, "q0");
    expect(code).toContain('.transition("q0", "a", "q1")');
  });
});
