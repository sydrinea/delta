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

describe("subset construction: empty alphabet is handled", () => {
  const emptyAlphabetNfa = nfa("empty alphabet")
    .states("q0", "q1")
    .start("q0")
    .accept("q1")
    .transition("q0", EPS, "q1")
    .build();

  const dfa = convertToDFA(emptyAlphabetNfa);

  it("creates one state from initial epsilon closure", () => {
    expect(dfa.states).toStrictEqual(new Set(["{q0,q1}"]));
  });

  it("keeps alphabet empty and has no outgoing transitions", () => {
    expect(dfa.alphabet).toStrictEqual(new Set());
    expect(dfa.transitions.get("{q0,q1}")?.size ?? 0).toBe(0);
  });

  it("marks closure state as accepting", () => {
    expect(dfa.acceptStates).toStrictEqual(new Set(["{q0,q1}"]));
  });
});

describe("subset construction: unreachable accepting states stay unreachable", () => {
  const unreachableAcceptNfa = nfa("unreachable accept")
    .alphabet("a")
    .states("q0", "q1", "qDead")
    .start("q0")
    .accept("qDead")
    .transition("q0", "a", "q1")
    .transition("q1", "a", "q1")
    .build();

  const dfa = convertToDFA(unreachableAcceptNfa);

  it("does not generate accepting DFA states", () => {
    expect(dfa.acceptStates).toStrictEqual(new Set());
  });

  it("contains only reachable subset states", () => {
    expect(dfa.states).toStrictEqual(new Set(["{q0}", "{q1}"]));
  });
});

describe("subset construction: generated names with preserveNames=false", () => {
  const namedNfa = nfa("renaming")
    .alphabet("a", "b")
    .states("q10", "q20", "q30")
    .start("q10")
    .accept("q30")
    .transition("q10", "a", "q20")
    .transition("q10", "b", "q10")
    .transition("q20", "a", "q20")
    .transition("q20", "b", "q30")
    .transition("q30", "a", "q20")
    .transition("q30", "b", "q10")
    .build();

  const dfa = convertToDFA(namedNfa, { preserveNames: false });

  it("uses generated qN state names", () => {
    expect(dfa.startState).toBe("q0");
    expect([...dfa.states].every((s) => /^q\d+$/.test(s))).toBe(true);
  });

  it("keeps transition graph deterministic after renaming", () => {
    const startTransitions = dfa.transitions.get(dfa.startState);
    expect(startTransitions?.size).toBe(2);
    expect(startTransitions?.get("a")?.size).toBe(1);
    expect(startTransitions?.get("b")?.size).toBe(1);
  });
});

describe("subset construction: epsilon chain before first symbol", () => {
  const epsilonChainNfa = nfa("epsilon chain")
    .alphabet("a")
    .states("q0", "q1", "q2", "q3")
    .start("q0")
    .accept("q3")
    .transition("q0", EPS, "q1")
    .transition("q1", EPS, "q2")
    .transition("q2", "a", "q3")
    .build();

  const dfa = convertToDFA(epsilonChainNfa);

  it("expands start closure across epsilon chain", () => {
    expect(dfa.startState).toBe("{q0,q1,q2}");
  });

  it("reaches accepting state after one symbol", () => {
    const onA = dfa.transitions.get("{q0,q1,q2}")?.get("a");
    expect(onA).toStrictEqual(new Set(["{q3}"]));
    expect(dfa.acceptStates).toStrictEqual(new Set(["{q3}"]));
  });
});
