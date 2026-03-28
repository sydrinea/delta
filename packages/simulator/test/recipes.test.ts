import { describe, it, expect } from "vitest";
import * as examples from "@delta/examples";
import { NFASchema, TMSchema, ExampleMetaSchema } from "@delta/build";
import { simulate, simulateTM } from "../src";

type SimulateFn = (machine: any, input: string) => { accepted: boolean };

const runners = [
  { schema: NFASchema, fn: simulate as SimulateFn, label: "NFAs" },
  { schema: TMSchema, fn: simulateTM as SimulateFn, label: "TMs" },
] as const;

const groups = runners.map(({ schema, fn, label }) => ({
  label,
  fn,
  pairs: Object.entries(examples).flatMap(([key, value]) => {
    if (key.endsWith("Meta")) return [];
    const machine = schema.safeParse(value);
    if (!machine.success) return [];
    const meta = ExampleMetaSchema.safeParse(
      examples[`${key}Meta` as keyof typeof examples],
    );
    if (!meta.success || !meta.data.tests?.length) return [];
    return [{ name: key, machine: machine.data, tests: meta.data.tests }];
  }),
}));

describe("example recipes", () => {
  for (const { label, fn, pairs } of groups) {
    describe(label, () => {
      for (const { name, machine, tests } of pairs) {
        describe(name, () => {
          it.each(tests)("$id: $input → $expected", ({ input, expected }) => {
            expect(fn(machine, input).accepted).toBe(expected);
          });
        });
      }
    });
  }
});
