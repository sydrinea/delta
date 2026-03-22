import { describe, it, expect } from "vitest";
import nfa from "@/lib/compiler/nfa";
import { convertToDFA } from "@/lib/transform/subset";
import { simulate } from "@/lib/simulator/nfa";
import { EPS } from "@/lib/compiler/constants";
import thompson from "@/lib/compiler/thompson";

describe("subset construction: epsilon loop", () => {
  const epsLoop = nfa("epsilon loop")
    .states("q0")
    .start("q0")
    .accept("q0")
    .bounce("q0", EPS, "q0")
    .build();

  const dfa = convertToDFA(epsLoop);

  describe("structure", () => {
    it("to produce exactly one DFA state", () => {
      expect(dfa.states).toStrictEqual(new Set(["{q0}"]));
    });

    it("start state is the combined epsilon closure {q0}", () => {
      expect(dfa.startState).toBe("{q0}");
    });

    it("accept state is {q0}", () => {
      expect(dfa.acceptStates).toStrictEqual(new Set(["{q0}"]));
    });

    it("has no transitions", () => {
      const transitionCount = dfa.transitions
        .values()
        .map((transitions) => transitions.size)
        .reduce((a, _) => a + 1);
      expect(transitionCount).toEqual(0);
    });
  });

  describe("simulation equivalence", () => {
    it("accepts exactly ''", () => {
      const cases = [
        { input: "a", expected: false },
        { input: "aa", expected: false },
        { input: "", expected: true },
      ];

      for (const { input, expected } of cases) {
        expect(simulate(dfa, input).accepted).toBe(expected);
      }
    });
  });
});

describe("subset construction: empty string with two states", () => {
  const emptyAccept = nfa("emptyAccept")
    .states("q0", "q1")
    .start("q0")
    .accept("q1")
    .transition("q0", EPS, "q1")
    .build();

  const dfa = convertToDFA(emptyAccept);

  describe("structure", () => {
    it("to produce exactly one DFA state", () => {
      expect(dfa.states).toStrictEqual(new Set(["{q0,q1}"]));
    });

    it("to produce exactly one DFA state using Thompson's construction", () => {
      const thompsonNfa = thompson("emptyAccept").eps().build();
      const thompsonDfa = convertToDFA(thompsonNfa).states;
      expect(thompsonDfa).toStrictEqual(new Set(["{q0,q1}"]));
    });

    it("start state immediately includes the accept state due to initial closure", () => {
      expect(dfa.startState).toBe("{q0,q1}");
      expect(dfa.acceptStates).toStrictEqual(new Set(["{q0,q1}"]));
    });
  });

  describe("simulation equivalence", () => {
    it("accepts ONLY the empty string", () => {
      const cases = [
        { input: "", expected: true },
        { input: "a", expected: false },
        { input: "aa", expected: false },
      ];

      for (const { input, expected } of cases) {
        expect(simulate(dfa, input).accepted).toBe(expected);
      }
    });
  });
});
