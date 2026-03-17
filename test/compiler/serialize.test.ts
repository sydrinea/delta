import { describe, it, expect } from "vitest";
import dfa from "../../src/compiler/dfa.js";
import { serialize, deserialize } from "../../src/compiler/serialize.js";
import { simulate } from "../../src/simulator/nfa.js";
import { NFAMessages } from "../../src/compiler/nfa.js";

describe("serialize/deserialize (onlyAs)", () => {
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

  const anf = serialize(onlyAs);

  it("serializes to correct ANF string", () => {
    expect(anf).toBe("onlyAs|q0,q1|a,b|q0|q0|q0>a>q0,q0>b>q1,q1>a>q1,q1>b>q1");
  });

  describe("deserialize", () => {
    const restored = deserialize(anf);

    it("restores name", () => {
      expect(restored.name).toBe("onlyAs");
    });

    it("restores alphabet", () => {
      expect(restored.alphabet).toStrictEqual(new Set(["a", "b"]));
    });

    it("restores states", () => {
      expect(restored.states).toStrictEqual(new Set(["q0", "q1"]));
    });

    it("restores start state", () => {
      expect(restored.startState).toBe("q0");
    });

    it("restores accept states", () => {
      expect(restored.acceptStates).toStrictEqual(new Set(["q0"]));
    });

    it("restores transitions", () => {
      const t = (from: string, symbol: string) =>
        restored.transitions.get(from)?.get(symbol);

      expect(t("q0", "a")).toStrictEqual(new Set(["q0"]));
      expect(t("q0", "b")).toStrictEqual(new Set(["q1"]));
      expect(t("q1", "a")).toStrictEqual(new Set(["q1"]));
      expect(t("q1", "b")).toStrictEqual(new Set(["q1"]));
    });

    it("simulation equivalence — accepts same strings as original", () => {
      const cases = [
        { input: "", expected: true },
        { input: "a", expected: true },
        { input: "aaa", expected: true },
        { input: "b", expected: false },
        { input: "ab", expected: false },
        { input: "ba", expected: false },
        { input: "aab", expected: false },
      ];

      for (const { input, expected } of cases) {
        expect(simulate(restored, input).accepted).toBe(expected);
      }
    });
  });

  it("round trips — serialize(deserialize(anf)) === anf", () => {
    expect(serialize(deserialize(anf))).toBe(anf);
  });
});

describe("invalid automata via builder", () => {
  it("throws if start state not declared", () => {
    expect(() =>
      deserialize("onlyAs|q0,q1|a,b|q99|q0|q0>a>q0,q0>b>q1,q1>a>q1,q1>b>q1"),
    ).toThrow(NFAMessages.startStateNotDeclared("q99"));
  });

  it("throws if accept state not declared", () => {
    expect(() =>
      deserialize("onlyAs|q0,q1|a,b|q0|q99|q0>a>q0,q0>b>q1,q1>a>q1,q1>b>q1"),
    ).toThrow(NFAMessages.acceptStateNotDeclared("q99"));
  });

  it("throws if transition source not declared", () => {
    expect(() =>
      deserialize("onlyAs|q0,q1|a,b|q0|q0|q99>a>q0,q0>b>q1,q1>a>q1,q1>b>q1"),
    ).toThrow(NFAMessages.transitionSourceNotDeclared("q99"));
  });

  it("throws if transition target not declared", () => {
    expect(() =>
      deserialize("onlyAs|q0,q1|a,b|q0|q0|q0>a>q99,q0>b>q1,q1>a>q1,q1>b>q1"),
    ).toThrow(NFAMessages.transitionTargetNotDeclared("q99"));
  });

  it("warns on transition symbol not in alphabet", () => {
    const m = deserialize(
      "onlyAs|q0,q1|a,b|q0|q0|q0>a>q0,q0>b>q1,q0>9>q1,q1>a>q1,q1>b>q1",
    );
    expect(m.messages).toContainEqual({
      severity: "warning",
      content: NFAMessages.transitionSymbolNotInAlphabet("9"),
    });
  });
});
