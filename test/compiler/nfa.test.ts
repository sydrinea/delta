import { describe, it, expect } from "vitest";
import nfa, { NFAMessages } from "@/lib/compiler/nfa";
import { getBuildError } from "../utils";
import { EPS } from "@/lib/compiler/constants";

describe("NFABuilder", () => {
  describe("valid construction", () => {
    it("builds a valid NFA with no messages", () => {
      const m = nfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "0", "q1")
        .transition("q0", "1", "q0")
        .transition("q1", "0", "q1")
        .transition("q1", "1", "q1")
        .build();

      expect(m.messages).toHaveLength(0);
      expect(m.startState).toBe("q0");
      expect([...m.acceptStates]).toStrictEqual(["q1"]);
    });

    it("attaches warnings to returned NFA", () => {
      const m = nfa("test")
        .alphabet("0", "1")
        .states("q0")
        .start("q0")
        .accept("q0")
        .transition("q0", "0", "q0")
        .build();

      expect(m.messages).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          content: NFAMessages.missingTransition("q0", "1"),
        }),
      );
    });

    it("allows nondeterministic transitions", () => {
      const m = nfa("test")
        .alphabet("a")
        .states("q0", "q1", "q2")
        .start("q0")
        .accept("q1", "q2")
        .transition("q0", "a", "q1")
        .transition("q0", "a", "q2")
        .build();

      expect(m.transitions.get("q0")?.get("a")).toStrictEqual(
        new Set(["q1", "q2"]),
      );
    });
  });

  describe("build()", () => {
    it("throws if called twice", () => {
      const builder = nfa("test")
        .alphabet("0")
        .states("q0")
        .start("q0")
        .accept("q0")
        .transition("q0", "0", "q0");

      builder.build();
      expect(() => builder.build()).toThrow(NFAMessages.alreadyBuilt);
    });

    it("throws if no start state defined", () => {
      const err = getBuildError(() =>
        nfa("test")
          .alphabet("0")
          .states("q0")
          .accept("q0")
          .transition("q0", "0", "q0")
          .build(),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.noStartState,
        }),
      );
    });
  });

  describe("start()", () => {
    it("throws if start state not declared", () => {
      const err = getBuildError(() =>
        nfa("test")
          .alphabet("0")
          .states("q0")
          .start("q99")
          .accept("q0")
          .transition("q0", "0", "q0")
          .build(),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.startStateNotDeclared("q99"),
        }),
      );
    });
  });

  describe("alphabet()", () => {
    it("throws if epsilon is included in the formal alphabet", () => {
      const builder = nfa("test")
        .alphabet("0", "1", EPS)
        .states("q0")
        .start("q0")
        .accept("q0")
        .transition("q0", "0", "q0");

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.epsilonInAlphabet,
        }),
      );

      const err = getBuildError(() => builder.build());
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.epsilonInAlphabet,
        }),
      );
    });
  });

  describe("accept()", () => {
    it("throws if accept state not declared", () => {
      const err = getBuildError(() =>
        nfa("test")
          .alphabet("0")
          .states("q0")
          .start("q0")
          .accept("q99")
          .transition("q0", "0", "q0")
          .build(),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.acceptStateNotDeclared("q99"),
        }),
      );
    });

    it("throws for each undeclared accept state", () => {
      const builder = nfa("test")
        .alphabet("0")
        .states("q0")
        .start("q0")
        .accept("q98", "q99")
        .transition("q0", "0", "q0");

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.acceptStateNotDeclared("q98"),
        }),
      );
      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.acceptStateNotDeclared("q99"),
        }),
      );

      const err = getBuildError(() => builder.build());
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.acceptStateNotDeclared("q98"),
        }),
      );
    });
  });

  describe("transition()", () => {
    it("throws if from state not declared", () => {
      const err = getBuildError(() =>
        nfa("test")
          .alphabet("0")
          .states("q0")
          .start("q0")
          .accept("q0")
          .transition("q99", "0", "q0")
          .build(),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.transitionSourceNotDeclared("q99"),
        }),
      );
    });

    it("throws if to state not declared", () => {
      const err = getBuildError(() =>
        nfa("test")
          .alphabet("0")
          .states("q0")
          .start("q0")
          .accept("q0")
          .transition("q0", "0", "q99")
          .build(),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.transitionTargetNotDeclared("q99"),
        }),
      );
    });

    it("warns if symbol not in alphabet", () => {
      const m = nfa("test")
        .alphabet("0")
        .states("q0")
        .start("q0")
        .accept("q0")
        .transition("q0", "9", "q0")
        .transition("q0", "0", "q0")
        .build();

      expect(m.messages).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          content: NFAMessages.transitionSymbolNotInAlphabet("9"),
        }),
      );
    });

    it("skips insertion but continues building on invalid symbol", () => {
      const m = nfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "9", "q1")
        .transition("q0", "0", "q1")
        .transition("q0", "1", "q0")
        .transition("q1", "0", "q1")
        .transition("q1", "1", "q1")
        .build();

      expect(m.messages).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          content: NFAMessages.transitionSymbolNotInAlphabet("9"),
        }),
      );
      expect(m.transitions.get("q0")?.get("0")).toStrictEqual(new Set(["q1"]));
    });

    it("accumulates multiple transition errors", () => {
      const builder = nfa("test")
        .alphabet("0")
        .states("q0")
        .start("q0")
        .accept("q0")
        .transition("q99", "0", "q0")
        .transition("q0", "0", "q99");

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.transitionSourceNotDeclared("q99"),
        }),
      );
      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.transitionTargetNotDeclared("q99"),
        }),
      );

      const err = getBuildError(() => builder.build());
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.transitionSourceNotDeclared("q99"),
        }),
      );
    });
  });

  describe("warnings", () => {
    it("warns for missing transition on a symbol", () => {
      const m = nfa("test")
        .alphabet("0", "1")
        .states("q0")
        .start("q0")
        .accept("q0")
        .transition("q0", "0", "q0")
        .build();

      expect(m.messages).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          content: NFAMessages.missingTransition("q0", "1"),
        }),
      );
    });

    it("warns for every missing transition", () => {
      const m = nfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "0", "q1")
        .build();

      const warnings = m.messages.filter((msg) => msg.severity === "warning");
      expect(warnings).toHaveLength(3);
    });

    it("produces no warnings for a total transition function", () => {
      const m = nfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "0", "q1")
        .transition("q0", "1", "q0")
        .transition("q1", "0", "q1")
        .transition("q1", "1", "q1")
        .build();

      expect(
        m.messages.filter((msg) => msg.severity === "warning"),
      ).toHaveLength(0);
    });
  });

  describe("messages getter", () => {
    it("exposes messages before build()", () => {
      const builder = nfa("test").alphabet("0").states("q0").start("q99");

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: NFAMessages.startStateNotDeclared("q99"),
        }),
      );
    });
  });
});
