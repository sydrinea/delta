import { describe, expect, it } from "vitest";
import tm from "@/lib/compiler/tm";
import { simulate } from "@/lib/simulator/tm";

const palindromes = () =>
  tm("test")
    .alphabet("0", "1")
    .tape("X", "Y", "_")
    .blank("_")
    .states("q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8")
    .start("q0")
    .accept("q6")
    .transition({ from: "q0", read: ["_"], move: ["R"], to: "q1" })
    .state("q1", (s) =>
      s
        .on(["0"], "R", "q2", "X")
        .on(["1"], "R", "q7", "Y")
        .on(["X", "Y"], "R", "q5")
        .on(["_"], "R", "q6"),
    )
    .state("q2", (s) =>
      s.on(["0", "1", "X", "Y"], "R", "q2").on(["_"], "L", "q3"),
    )
    .state("q3", (s) =>
      s
        .on(["X", "Y"], "L", "q3")
        .on(["_"], "R", "q5")
        .on(["0"], "L", "q4", "X"),
    )
    .state("q7", (s) =>
      s.on(["0", "1", "X", "Y"], "R", "q7").on(["_"], "L", "q8"),
    )
    .state("q8", (s) =>
      s
        .on(["X", "Y"], "L", "q8")
        .on(["_"], "R", "q5")
        .on(["1"], "L", "q4", "Y"),
    )
    .state("q4", (s) => s.on(["0", "1"], "L", "q4").on(["X", "Y"], "R", "q1"))
    .state("q5", (s) => s.on(["X", "Y"], "R", "q5").on(["_"], "R", "q6"));

describe("TMBuilder", () => {
  describe("valid construction", () => {
    it("builds a valid TM with no messages", () => {
      expect(() => palindromes().build()).not.toThrow();
    });
  });

  describe("simulation test suite", () => {
    const machine = palindromes().build();

    it("accepts empty input", () => {
      expect(simulate(machine, "").accepted).toBe(true);
    });

    it("accepts single symbol 0 (odd edge)", () => {
      expect(simulate(machine, "0").accepted).toBe(true);
    });

    it("accepts single symbol 1 (odd edge)", () => {
      expect(simulate(machine, "1").accepted).toBe(true);
    });

    it("accepts 00 (even edge)", () => {
      expect(simulate(machine, "00").accepted).toBe(true);
    });

    it("accepts 11 (even edge)", () => {
      expect(simulate(machine, "11").accepted).toBe(true);
    });

    it("rejects 01 (even edge non-palindrome)", () => {
      expect(simulate(machine, "01").accepted).toBe(false);
    });

    it("rejects 10 (even edge non-palindrome)", () => {
      expect(simulate(machine, "10").accepted).toBe(false);
    });

    it("accepts 010 (odd palindrome)", () => {
      expect(simulate(machine, "010").accepted).toBe(true);
    });

    it("accepts 101 (odd palindrome)", () => {
      expect(simulate(machine, "101").accepted).toBe(true);
    });

    it("rejects 001 (odd non-palindrome)", () => {
      expect(simulate(machine, "001").accepted).toBe(false);
    });

    it("rejects 110 (odd non-palindrome)", () => {
      expect(simulate(machine, "110").accepted).toBe(false);
    });

    it("accepts 0110 (even palindrome)", () => {
      expect(simulate(machine, "0110").accepted).toBe(true);
    });

    it("accepts 1001 (even palindrome)", () => {
      expect(simulate(machine, "1001").accepted).toBe(true);
    });

    it("rejects 0101 (even non-palindrome)", () => {
      expect(simulate(machine, "0101").accepted).toBe(false);
    });

    it("rejects 1010 (even non-palindrome)", () => {
      expect(simulate(machine, "1010").accepted).toBe(false);
    });

    it("accepts 00100 (odd palindrome)", () => {
      expect(simulate(machine, "00100").accepted).toBe(true);
    });

    it("accepts 11011 (odd palindrome)", () => {
      expect(simulate(machine, "11011").accepted).toBe(true);
    });

    it("rejects 00110 (odd non-palindrome)", () => {
      expect(simulate(machine, "00110").accepted).toBe(false);
    });

    it("rejects 11001 (odd non-palindrome)", () => {
      expect(simulate(machine, "11001").accepted).toBe(false);
    });

    it("accepts 011110 (even palindrome)", () => {
      expect(simulate(machine, "011110").accepted).toBe(true);
    });

    it("accepts 100001 (even palindrome)", () => {
      expect(simulate(machine, "100001").accepted).toBe(true);
    });

    it("rejects 011010 (even non-palindrome)", () => {
      expect(simulate(machine, "011010").accepted).toBe(false);
    });

    it("rejects 100011 (even non-palindrome)", () => {
      expect(simulate(machine, "100011").accepted).toBe(false);
    });
  });
});
