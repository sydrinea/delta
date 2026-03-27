import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import nfa from "@/lib/compiler/nfa";
import dfa from "@/lib/compiler/dfa";
import { EPS } from "@/lib/compiler/constants";
import thompson from "@/lib/compiler/thompson";
import { convertToDFA } from "@/lib/transform/subset";
import { q } from "@/lib/compiler/helpers";
import { simulate } from "@/lib/simulator/nfa";
import cases from "./nfa";

function stripSource(src: string): string {
  return src
    .replace(/^\/\/@ts-nocheck\s*\n/m, "")
    .replace(/^import\s.*?["']delta:lib["'].*?\n/m, "")
    .replace(/^export default\s+/m, "return ");
}

const EXAMPLES_DIR = join(__dirname, "../../public/examples/nfa");

function loadMachine(filename: string) {
  const src = stripSource(readFileSync(join(EXAMPLES_DIR, filename), "utf-8"));
  return new Function(
    "nfa",
    "dfa",
    "EPS",
    "thompson",
    "convertToDFA",
    "q",
    src,
  )(nfa, dfa, EPS, thompson, convertToDFA, q);
}

const filenames = readdirSync(EXAMPLES_DIR).filter(
  (f) => f.endsWith(".ts") && f in cases,
);
const machines = Object.fromEntries(
  filenames.map((f) => [f, loadMachine(f)]),
);

describe("NFA example recipes", () => {
  for (const filename of filenames) {
    const machine = machines[filename];
    const machineCases = cases[filename];

    if (!machineCases) {
      it.todo(`${filename}: no test cases defined`);
      continue;
    }

    describe(filename.replace(".ts", ""), () => {
      it.each(machineCases)(
        "input '%s' → accepted=%s (%s)",
        (input, expected) => {
          expect(simulate(machine, input).accepted).toBe(expected);
        },
      );
    });
  }
});
