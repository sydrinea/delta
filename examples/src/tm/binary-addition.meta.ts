import { ExampleMeta } from "../schemas";

export default {
  label: "Binary Addition",
  type: "tm",
  tests: [
    { id: "add-1", input: "0#0", expected: true },
    { id: "add-2", input: "1#1", expected: true },
    { id: "add-3", input: "101#11", expected: true },
    { id: "add-4", input: "1001#110", expected: true },
    { id: "add-invalid", input: "10101", expected: false },
  ],
} satisfies ExampleMeta;
