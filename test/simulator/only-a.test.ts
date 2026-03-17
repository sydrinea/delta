import { describe, it, expect } from "vitest";
import dfa from "../../src/compiler/dfa";
import { simulate } from "../../src/simulator/nfa";

describe("onlyAs (DFA)", () => {
  const onlyAs = dfa("onlyAs")
    .alphabet("a", "b")
    .states("q0", "q1")
    .start("q0")
    .accept("q0")
    .transition("q0", "a", "q0")
    .transition("q0", "b", "q1")
    .transition("q1", "a", "q1")
    .transition("q1", "b", "q1")
    .build();

  describe("acceptance", () => {
    it("accepts empty string", () => {
      expect(simulate(onlyAs, "").accepted).toBe(true);
    });

    it("accepts 'a'", () => {
      expect(simulate(onlyAs, "a").accepted).toBe(true);
    });

    it("accepts 'aaa'", () => {
      expect(simulate(onlyAs, "aaa").accepted).toBe(true);
    });

    it("rejects 'b'", () => {
      expect(simulate(onlyAs, "b").accepted).toBe(false);
    });

    it("rejects 'ab'", () => {
      expect(simulate(onlyAs, "ab").accepted).toBe(false);
    });

    it("rejects 'ba'", () => {
      expect(simulate(onlyAs, "ba").accepted).toBe(false);
    });

    it("rejects 'aab'", () => {
      expect(simulate(onlyAs, "aab").accepted).toBe(false);
    });
  });

  describe("trace", () => {
    it("trace for 'aab' shows single active state at each step", () => {
      const { trace } = simulate(onlyAs, "aab");

      expect(trace[0]).toStrictEqual({ symbol: null, states: new Set(["q0"]) });
      expect(trace[1]).toStrictEqual({ symbol: "a", states: new Set(["q0"]) });
      expect(trace[2]).toStrictEqual({ symbol: "a", states: new Set(["q0"]) });
      expect(trace[3]).toStrictEqual({ symbol: "b", states: new Set(["q1"]) });
    });

    it("active state set never exceeds size 1", () => {
      const { trace } = simulate(onlyAs, "aabaa");
      expect(trace.every((step) => step.states.size === 1)).toBe(true);
    });
  });
});
