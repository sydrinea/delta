import { describe, it, expect } from "vitest";
import nfa from "../../src/compiler/nfa";
import { simulate } from "../../src/simulator/nfa";

describe("simulate endsInAB (NFA)", () => {
  const endsInAB = nfa("endsInAB")
    .alphabet("a", "b")
    .states("q0", "q1", "q2")
    .start("q0")
    .accept("q2")
    .transition("q0", "a", "q0")
    .transition("q0", "b", "q0")
    .transition("q0", "a", "q1")
    .transition("q1", "b", "q2")
    .build();

  describe("acceptance", () => {
    it("accepts 'ab'", () => {
      expect(simulate(endsInAB, "ab").accepted).toBe(true);
    });

    it("accepts 'aab'", () => {
      expect(simulate(endsInAB, "aab").accepted).toBe(true);
    });

    it("accepts 'bab'", () => {
      expect(simulate(endsInAB, "bab").accepted).toBe(true);
    });

    it("accepts 'ababab'", () => {
      expect(simulate(endsInAB, "ababab").accepted).toBe(true);
    });

    it("rejects 'a'", () => {
      expect(simulate(endsInAB, "a").accepted).toBe(false);
    });

    it("rejects 'b'", () => {
      expect(simulate(endsInAB, "b").accepted).toBe(false);
    });

    it("rejects 'ba'", () => {
      expect(simulate(endsInAB, "ba").accepted).toBe(false);
    });

    it("rejects empty string", () => {
      expect(simulate(endsInAB, "").accepted).toBe(false);
    });

    it("rejects 'aba'", () => {
      expect(simulate(endsInAB, "aba").accepted).toBe(false);
    });
  });

  describe("trace", () => {
    it("trace for 'ab' shows nondeterministic state set after 'a'", () => {
      const { trace } = simulate(endsInAB, "ab");

      // initial state before any input
      expect(trace[0]).toStrictEqual({ symbol: null, states: new Set(["q0"]) });
      // after 'a': q0 loops to q0, and nondeterministically goes to q1
      expect(trace[1]).toStrictEqual({
        symbol: "a",
        states: new Set(["q0", "q1"]),
      });
      // after 'b': q0 loops to q0, q1 advances to q2
      expect(trace[2]).toStrictEqual({
        symbol: "b",
        states: new Set(["q0", "q2"]),
      });
    });

    it("trace length equals input length + 1", () => {
      expect(simulate(endsInAB, "aab").trace).toHaveLength(4);
      expect(simulate(endsInAB, "").trace).toHaveLength(1);
    });
  });
});
