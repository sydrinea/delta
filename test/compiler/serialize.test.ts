import { describe, it, expect } from "vitest";
import dfa from "@/lib/compiler/dfa";
import { serialize, deserialize } from "@/lib/compiler/serialize";
import { simulate } from "@/lib/simulator/nfa";
import { NFAMessages } from "@/lib/compiler/nfa";
import { getBuildError } from "../utils";

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
    expect(anf).toBe("onlyAs|q0;q1|a;b|q0|q0|q0>a>q0;q0>b>q1;q1>a>q1;q1>b>q1");
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
    const err = getBuildError(() =>
      deserialize("onlyAs|q0;q1|a;b|q99|q0|q0>a>q0;q0>b>q1;q1>a>q1;q1>b>q1"),
    );
    expect(err.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: NFAMessages.startStateNotDeclared("q99"),
      }),
    );
  });

  it("throws if accept state not declared", () => {
    const err = getBuildError(() =>
      deserialize("onlyAs|q0;q1|a;b|q0|q99|q0>a>q0;q0>b>q1;q1>a>q1;q1>b>q1"),
    );
    expect(err.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: NFAMessages.acceptStateNotDeclared("q99"),
      }),
    );
  });

  it("throws if transition source not declared", () => {
    const err = getBuildError(() =>
      deserialize("onlyAs|q0;q1|a;b|q0|q0|q99>a>q0;q0>b>q1;q1>a>q1;q1>b>q1"),
    );
    expect(err.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: NFAMessages.transitionSourceNotDeclared("q99"),
      }),
    );
  });

  it("throws if transition target not declared", () => {
    const err = getBuildError(() =>
      deserialize("onlyAs|q0;q1|a;b|q0|q0|q0>a>q99;q0>b>q1;q1>a>q1;q1>b>q1"),
    );
    expect(err.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: NFAMessages.transitionTargetNotDeclared("q99"),
      }),
    );
  });

  it("warns on transition symbol not in alphabet", () => {
    const m = deserialize(
      "onlyAs|q0;q1|a;b|q0|q0|q0>a>q0;q0>b>q1;q0>9>q1;q1>a>q1;q1>b>q1",
    );
    expect(m.messages).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        content: NFAMessages.transitionSymbolNotInAlphabet("9"),
      }),
    );
  });
});

describe("edge cases", () => {
  it("handles an empty alphabet and empty transitions", () => {
    const emptyAlpha = dfa("emptyAlpha")
      .states("q0")
      .start("q0")
      .accept("q0")
      .build();

    const anf = serialize(emptyAlpha);
    expect(anf).toBe("emptyAlpha|q0||q0|q0|");

    const restored = deserialize(anf);
    expect(restored.alphabet.size).toBe(0);
    const transitionCount = restored.transitions
      .values()
      .map((transitions) => transitions.size)
      .reduce((a, _) => a + 1);
    expect(transitionCount).toEqual(0);
    expect(restored.startState).toBe("q0");
  });

  it("handles a machine with no accept states", () => {
    const rejectAll = dfa("rejectAll")
      .alphabet("a")
      .states("q0")
      .start("q0")
      .transition("q0", "a", "q0")
      .build();

    const anf = serialize(rejectAll);
    expect(anf).toBe("rejectAll|q0|a|q0||q0>a>q0");

    const restored = deserialize(anf);
    expect(restored.acceptStates.size).toBe(0);
  });
});
