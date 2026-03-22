import { NFABuildError } from "@/lib/compiler/nfa";
import { expect } from "vitest";

export function getBuildError(fn: () => void): NFABuildError {
  try {
    fn();
    expect.fail("Expected function to throw NFABuildError, but it succeeded.");
  } catch (err) {
    expect(err).toBeInstanceOf(NFABuildError);
    return err as NFABuildError;
  }
}
