import { ExampleMeta } from "../schemas";
import oddZerosOrEndsWithTwoOnesMeta from "./odd-zeros-or-ends-with-two-ones.meta";

export default {
  ...oddZerosOrEndsWithTwoOnesMeta,
  label: "Odd Zeros or Ends With Two Ones (Thompson)",
  type: "nfa",
} satisfies ExampleMeta;
