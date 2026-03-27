import { nfa, EPS, thompson } from "@delta/build";
import { describe, it, expect } from "vitest";
import { convertToDFA } from "../src";

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
});
