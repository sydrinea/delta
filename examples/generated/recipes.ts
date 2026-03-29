// GENERATED FILE - DO NOT EDIT

type TestCase = { id: string; input: string; expected: boolean };
type Recipe = { label: string; path: string; tests: TestCase[] };
type Recipes = { nfa: Record<string, Recipe>; tm: Record<string, Recipe> };

export const recipes: Recipes = {
  nfa: {},
  tm: {}
};

recipes.nfa["aDivisibleBy2Or3"] = {
  label: "# of A's divisible by 2 or 3",
  path: "/examples/nfa/a-divisible-by-2-or-3.ts",
  tests: [{"id":"mod-0","input":"","expected":true},{"id":"mod-1","input":"a","expected":false},{"id":"mod-2","input":"aa","expected":true},{"id":"mod-3","input":"aaa","expected":true},{"id":"mod-4","input":"aaaa","expected":true},{"id":"mod-5","input":"aaaaa","expected":false},{"id":"mod-6","input":"aaaaaa","expected":true}]
};
recipes.nfa["endsInAb"] = {
  label: "Strings ending in ab",
  path: "/examples/nfa/ends-in-ab.ts",
  tests: [{"id":"empty","input":"","expected":false},{"id":"single-a","input":"a","expected":false},{"id":"single-b","input":"b","expected":false},{"id":"exact-match","input":"ab","expected":true},{"id":"reversed","input":"ba","expected":false},{"id":"prefix-a","input":"aab","expected":true},{"id":"prefix-b","input":"bab","expected":true},{"id":"suffix-a","input":"aba","expected":false},{"id":"suffix-b","input":"abb","expected":false},{"id":"multiple-ab","input":"abab","expected":true},{"id":"long-match","input":"bbbaaab","expected":true},{"id":"long-fail","input":"bbaba","expected":false}]
};
recipes.nfa["oddZerosOrEndsWithTwoOnesThompson"] = {
  label: "Odd Zeros or Ends With Two Ones (Thompson)",
  path: "/examples/nfa/odd-zeros-or-ends-with-two-ones-thompson.ts",
  tests: [{"id":"oztwo-1","input":"0","expected":true},{"id":"oztwo-2","input":"000","expected":true},{"id":"oztwo-3","input":"00000","expected":true},{"id":"oztwo-4","input":"00","expected":false},{"id":"oztwo-5","input":"0000","expected":false},{"id":"oztwo-6","input":"11","expected":true},{"id":"oztwo-7","input":"011","expected":true},{"id":"oztwo-8","input":"111","expected":true},{"id":"oztwo-9","input":"0011","expected":true},{"id":"oztwo-10","input":"10011","expected":true},{"id":"oztwo-11","input":"00011","expected":true},{"id":"oztwo-12","input":"","expected":false},{"id":"oztwo-13","input":"1","expected":false},{"id":"oztwo-14","input":"10","expected":false},{"id":"oztwo-15","input":"01","expected":false},{"id":"oztwo-16","input":"010","expected":false},{"id":"oztwo-17","input":"0110","expected":false}]
};
recipes.nfa["oddZerosOrEndsWithTwoOnes"] = {
  label: "Odd Zeros or Ends With Two Ones",
  path: "/examples/nfa/odd-zeros-or-ends-with-two-ones.ts",
  tests: [{"id":"oztwo-1","input":"0","expected":true},{"id":"oztwo-2","input":"000","expected":true},{"id":"oztwo-3","input":"00000","expected":true},{"id":"oztwo-4","input":"00","expected":false},{"id":"oztwo-5","input":"0000","expected":false},{"id":"oztwo-6","input":"11","expected":true},{"id":"oztwo-7","input":"011","expected":true},{"id":"oztwo-8","input":"111","expected":true},{"id":"oztwo-9","input":"0011","expected":true},{"id":"oztwo-10","input":"10011","expected":true},{"id":"oztwo-11","input":"00011","expected":true},{"id":"oztwo-12","input":"","expected":false},{"id":"oztwo-13","input":"1","expected":false},{"id":"oztwo-14","input":"10","expected":false},{"id":"oztwo-15","input":"01","expected":false},{"id":"oztwo-16","input":"010","expected":false},{"id":"oztwo-17","input":"0110","expected":false}]
};
recipes.nfa["regularGrammar"] = {
  label: "String ending with 'ab' (Regular Grammar)",
  path: "/examples/nfa/regular-grammar.ts",
  tests: [{"id":"empty","input":"","expected":false},{"id":"single-a","input":"a","expected":false},{"id":"single-b","input":"b","expected":false},{"id":"exact-match","input":"ab","expected":true},{"id":"reversed","input":"ba","expected":false},{"id":"prefix-a","input":"aab","expected":true},{"id":"prefix-b","input":"bab","expected":true},{"id":"suffix-a","input":"aba","expected":false},{"id":"suffix-b","input":"abb","expected":false},{"id":"multiple-ab","input":"abab","expected":true},{"id":"long-match","input":"bbbaaab","expected":true},{"id":"long-fail","input":"bbaba","expected":false}]
};
recipes.nfa["thompson"] = {
  label: "Thompson's Construction (Regex to DFA)",
  path: "/examples/nfa/thompson.ts",
  tests: [{"id":"thomp-empty","input":"","expected":true},{"id":"thomp-only-ones","input":"1111","expected":true},{"id":"thomp-three-zeros","input":"000","expected":true},{"id":"thomp-mixed-three","input":"101101011","expected":true},{"id":"thomp-six-zeros","input":"000000","expected":true},{"id":"thomp-one-zero","input":"0","expected":false},{"id":"thomp-mixed-one","input":"11011","expected":false},{"id":"thomp-two-zeros","input":"00","expected":false},{"id":"thomp-mixed-two","input":"10101","expected":false},{"id":"thomp-four-zeros","input":"0000","expected":false}]
};
recipes.tm["binaryAddition"] = {
  label: "Binary Addition",
  path: "/examples/tm/binary-addition.ts",
  tests: [{"id":"add-1","input":"0#0","expected":true},{"id":"add-2","input":"1#1","expected":true},{"id":"add-3","input":"101#11","expected":true},{"id":"add-4","input":"1001#110","expected":true},{"id":"add-invalid","input":"10101","expected":false}]
};
recipes.tm["binaryDivisionByThree"] = {
  label: "Binary Numbers Divisible by 3",
  path: "/examples/tm/binary-division-by-three.ts",
  tests: [{"id":"div3-1","input":"","expected":true},{"id":"div3-2","input":"0","expected":true},{"id":"div3-3","input":"11","expected":true},{"id":"div3-4","input":"110","expected":true},{"id":"div3-5","input":"1","expected":false},{"id":"div3-6","input":"10","expected":false}]
};
recipes.tm["binaryPalindrome"] = {
  label: "Binary Palindrome",
  path: "/examples/tm/binary-palindrome.ts",
  tests: [{"id":"pal-empty","input":"","expected":true},{"id":"pal-single-0","input":"0","expected":true},{"id":"pal-single-1","input":"1","expected":true},{"id":"pal-even-true","input":"1001","expected":true},{"id":"pal-even-false","input":"1010","expected":false},{"id":"pal-odd-true","input":"10101","expected":true},{"id":"pal-odd-false","input":"10010","expected":false},{"id":"pal-long-true","input":"11011011","expected":true}]
};
