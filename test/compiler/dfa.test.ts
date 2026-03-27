import { describe, it, expect } from "vitest";
import dfa, { DFAMessages } from "@/lib/compiler/dfa";
import { getBuildError } from "../utils";
import { NFABuildError } from "@/lib/compiler/nfa";

describe("DFABuilder", () => {
  describe("nondeterministic transitions", () => {
    it("throws on a second transition for the same state and symbol", () => {
      const builder = dfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "0", "q1")
        .transition("q0", "0", "q0");

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.nondeterministicTransition("q0", "0"),
        }),
      );

      const err = getBuildError(NFABuildError, () => builder.build());
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.nondeterministicTransition("q0", "0"),
        }),
      );
    });

    it("allows different symbols from the same state", () => {
      const m = dfa("test")
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
    });
  });

  describe("missing transitions", () => {
    it("throws on missing transition for a symbol", () => {
      const err = getBuildError(NFABuildError, () =>
        dfa("test")
          .alphabet("0", "1")
          .states("q0", "q1")
          .start("q0")
          .accept("q1")
          .transition("q0", "0", "q1")
          .transition("q0", "1", "q0")
          .transition("q1", "0", "q1")
          // missing q1 --1-->
          .build(),
      );

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.missingTransition("q1", "1"),
        }),
      );
    });

    it("accumulates errors for all missing transitions", () => {
      const builder = dfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "0", "q1");
      // missing q0 --1--> and both q1 transitions

      const err = getBuildError(NFABuildError, () => builder.build());

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.missingTransition("q0", "1"),
        }),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.missingTransition("q1", "0"),
        }),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.missingTransition("q1", "1"),
        }),
      );
    });

    it("accumulates both nondeterministic and missing transition errors", () => {
      const builder = dfa("test")
        .alphabet("0", "1")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .transition("q0", "0", "q1")
        .transition("q0", "0", "q0") // nondeterministic — caught eagerly
        .transition("q0", "1", "q0");
      // missing q1 --0--> and q1 --1-->

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.nondeterministicTransition("q0", "0"),
        }),
      );

      const err = getBuildError(NFABuildError, () => builder.build());

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.nondeterministicTransition("q0", "0"),
        }),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.missingTransition("q1", "0"),
        }),
      );
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: DFAMessages.missingTransition("q1", "1"),
        }),
      );
    });

    it("produces no errors for a total transition function", () => {
      const m = dfa("test")
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
    });
  });
});
