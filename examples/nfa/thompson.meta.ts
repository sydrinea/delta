import type { ExampleMeta } from "@delta/build";

export default {
  label: "Thompson's Construction (Regex to DFA)",
  type: "nfa",
  tests: [
    { id: "thomp-empty", input: "", expected: true },
    { id: "thomp-only-ones", input: "1111", expected: true },
    { id: "thomp-three-zeros", input: "000", expected: true },
    { id: "thomp-mixed-three", input: "101101011", expected: true },
    { id: "thomp-six-zeros", input: "000000", expected: true },
    { id: "thomp-one-zero", input: "0", expected: false },
    { id: "thomp-mixed-one", input: "11011", expected: false },
    { id: "thomp-two-zeros", input: "00", expected: false },
    { id: "thomp-mixed-two", input: "10101", expected: false },
    { id: "thomp-four-zeros", input: "0000", expected: false },
  ],
} satisfies ExampleMeta;
