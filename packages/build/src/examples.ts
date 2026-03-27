export interface TestCase {
  id: string;
  input: string;
  expected: boolean;
}

export interface ExampleMeta {
  label: string;
  type: "nfa" | "tm";
  tests?: TestCase[];
}

export interface Example extends ExampleMeta {
  key: string;
  path: string;
}
