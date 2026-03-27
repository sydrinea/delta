import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import cases from "./tm";
import { multitape, tm, TuringMachine } from "@delta/build";
import { simulateTM } from "../src";

function stripSource(src: string): string {
  return src
    .replace(/^\/\/@ts-nocheck\s*\n/m, "")
    .replace(/^import\s.*?["']delta:lib["'].*?\n/m, "")
    .replace(/^export default\s+/m, "return ");
}

const EXAMPLES_DIR = join(__dirname, "../../../apps/client/public/examples/tm");

function loadMachine(filename: string): TuringMachine {
  const src = stripSource(readFileSync(join(EXAMPLES_DIR, filename), "utf-8"));
  return new Function("tm", "multitape", src)(tm, multitape) as TuringMachine;
}

const filenames = readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith(".ts"));
const machines = Object.fromEntries(filenames.map((f) => [f, loadMachine(f)]));

function cell(s: string): string {
  return s.replace(/\[|\]/g, "");
}

function tape3Result(result: ReturnType<typeof simulateTM>): string {
  return result.trace[result.trace.length - 1].tapes[2]
    .map(cell)
    .filter((c) => c !== "_")
    .join("");
}

describe("TM example recipes", () => {
  for (const filename of filenames) {
    const machine = machines[filename]!;
    const machineCases = cases[filename];

    if (!machineCases) {
      it.todo(`${filename}: no test cases defined`);
      continue;
    }

    describe(filename.replace(".ts", ""), () => {
      it.each(machineCases)(
        "input '%s' → accepted=%s (%s)",
        (input, expected) => {
          expect(simulateTM(machine, input).accepted).toBe(expected);
        },
      );
    });
  }

  describe("binary-addition tape output", () => {
    const machine = machines["binary-addition.ts"]!;

    it.each([
      ["0#0", "0", "0+0=0"],
      ["1#0", "1", "1+0=1"],
      ["0#1", "1", "0+1=1"],
      ["1#1", "10", "1+1=10"],
      ["10#11", "101", "2+3=5"],
      ["11#11", "110", "3+3=6"],
      ["1010#101", "1111", "10+5=15"],
    ] as const)(
      "simulate('%s') → tape 3 contains '%s' (%s)",
      (input, expectedSum, _) => {
        const result = simulateTM(machine, input);
        expect(result.accepted).toBe(true);
        expect(tape3Result(result)).toContain(expectedSum);
      },
    );
  });
});
