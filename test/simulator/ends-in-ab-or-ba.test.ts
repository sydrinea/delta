import { describe, it, expect } from "vitest";
import nfa from "../../src/compiler/nfa.js";
import { EPS } from "../../src/compiler/constants.js";
import { simulate } from "../../src/simulator/nfa.js";

describe("simulate endsInABOrBA (NFA)", () => {
  const endsInABOrBA = nfa("endsInABOrBA")
    .alphabet("a", "b")
    .states("q0", "q1", "q2", "q3", "q4", "q5", "q6")
    .start("q0")
    .accept("q3", "q6")
    .transition("q0", EPS, "q1")
    .transition("q0", EPS, "q4")
    // ends in ab branch
    .transition("q1", "a", "q1")
    .transition("q1", "b", "q1")
    .transition("q1", "a", "q2")
    .transition("q2", "b", "q3")
    // ends in ba branch
    .transition("q4", "a", "q4")
    .transition("q4", "b", "q4")
    .transition("q4", "b", "q5")
    .transition("q5", "a", "q6")
    .build();

  describe("acceptance", () => {
    it("accepts 'ab'", () => {
      expect(simulate(endsInABOrBA, "ab").accepted).toBe(true);
    });

    it("accepts 'ba'", () => {
      expect(simulate(endsInABOrBA, "ba").accepted).toBe(true);
    });

    it("accepts 'aab'", () => {
      expect(simulate(endsInABOrBA, "aab").accepted).toBe(true);
    });

    it("accepts 'bba'", () => {
      expect(simulate(endsInABOrBA, "bba").accepted).toBe(true);
    });

    it("accepts 'abab'", () => {
      expect(simulate(endsInABOrBA, "abab").accepted).toBe(true);
    });

    it("accepts 'baba'", () => {
      expect(simulate(endsInABOrBA, "baba").accepted).toBe(true);
    });

    it("accepts 'abba'", () => {
      expect(simulate(endsInABOrBA, "abba").accepted).toBe(true);
    });

    it("rejects empty string", () => {
      expect(simulate(endsInABOrBA, "").accepted).toBe(false);
    });

    it("rejects 'a'", () => {
      expect(simulate(endsInABOrBA, "a").accepted).toBe(false);
    });

    it("rejects 'b'", () => {
      expect(simulate(endsInABOrBA, "b").accepted).toBe(false);
    });

    it("rejects 'aa'", () => {
      expect(simulate(endsInABOrBA, "aa").accepted).toBe(false);
    });

    it("rejects 'bb'", () => {
      expect(simulate(endsInABOrBA, "bb").accepted).toBe(false);
    });

    it("rejects 'abb'", () => {
      expect(simulate(endsInABOrBA, "abb").accepted).toBe(false);
    });

    it("rejects 'baa'", () => {
      expect(simulate(endsInABOrBA, "baa").accepted).toBe(false);
    });
  });

  describe("trace", () => {
    it("initial epsilon closure expands to q0, q1, q4", () => {
      const { trace } = simulate(endsInABOrBA, "ab");
      expect(trace[0]).toStrictEqual({
        symbol: null,
        states: new Set(["q0", "q1", "q4"]),
      });
    });

    it("trace for 'ab' shows correct state sets at each step", () => {
      const { trace } = simulate(endsInABOrBA, "ab");

      // after 'a': q1 loops to q1, nondeterministically to q2; q4 loops to q4
      expect(trace[1]).toStrictEqual({
        symbol: "a",
        states: new Set(["q1", "q2", "q4"]),
      });
      // after 'b': q1 loops to q1, q2 advances to q3 (accept); q4 loops to q4, nondeterministically to q5
      expect(trace[2]).toStrictEqual({
        symbol: "b",
        states: new Set(["q1", "q3", "q4", "q5"]),
      });
    });

    it("trace for 'ba' shows correct state sets at each step", () => {
      const { trace } = simulate(endsInABOrBA, "ba");

      // after 'b': q1 loops to q1; q4 loops to q4, nondeterministically to q5
      expect(trace[1]).toStrictEqual({
        symbol: "b",
        states: new Set(["q1", "q4", "q5"]),
      });
      // after 'a': q1 loops to q1, nondeterministically to q2; q4 loops to q4; q5 advances to q6 (accept)
      expect(trace[2]).toStrictEqual({
        symbol: "a",
        states: new Set(["q1", "q2", "q4", "q6"]),
      });
    });

    it("trace length equals input length + 1", () => {
      expect(simulate(endsInABOrBA, "ab").trace).toHaveLength(3);
      expect(simulate(endsInABOrBA, "baba").trace).toHaveLength(5);
      expect(simulate(endsInABOrBA, "").trace).toHaveLength(1);
    });
  });
});
