import { ExampleMeta } from "../schemas";

export default {
  label: "Binary Numbers Divisible by 3",
  type: "tm",
  tests: [
    { id: "div3-1", input: "", expected: true },
    { id: "div3-2", input: "0", expected: true },
    { id: "div3-3", input: "11", expected: true },
    { id: "div3-4", input: "110", expected: true },
    { id: "div3-5", input: "1", expected: false },
    { id: "div3-6", input: "10", expected: false },
  ],
} satisfies ExampleMeta;
