import { ExampleMeta } from "../schemas";

export default {
  label: "# of A's divisible by 2 or 3",
  type: "nfa",
  tests: [
    { id: "mod-0", input: "", expected: true },
    { id: "mod-1", input: "a", expected: false },
    { id: "mod-2", input: "aa", expected: true },
    { id: "mod-3", input: "aaa", expected: true },
    { id: "mod-4", input: "aaaa", expected: true },
    { id: "mod-5", input: "aaaaa", expected: false },
    { id: "mod-6", input: "aaaaaa", expected: true },
  ],
} satisfies ExampleMeta;
