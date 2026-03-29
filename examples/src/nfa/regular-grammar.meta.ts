import endsInAbMeta from "./ends-in-ab.meta";
import { ExampleMeta } from "../schemas";

export default {
  ...endsInAbMeta,
  label: "String ending with 'ab' (Regular Grammar)",
  type: "nfa",
} satisfies ExampleMeta;
