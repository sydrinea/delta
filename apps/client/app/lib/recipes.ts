import type { TestCase } from "@/store/deltaStore";
import { examples } from "@delta/examples";
import type { Example } from "@delta/build";

export type Recipe = {
  label: string;
  path: string;
  tests: TestCase[];
};

export type Recipes = {
  nfa: Record<string, Recipe>;
  tm: Record<string, Recipe>;
};

function mapExamplesToRecipes(record: Record<string, Example>): Record<string, Recipe> {
  const mapped: Record<string, Recipe> = {};
  for (const [key, value] of Object.entries(record)) {
    mapped[key] = {
      label: value.label,
      path: value.path,
      tests: value.tests || []
    };
  }
  return mapped;
}

export default {
  nfa: mapExamplesToRecipes(examples.nfa),
  tm: mapExamplesToRecipes(examples.tm),
};
