import type { ExampleMeta } from '../schemas'

export default {
  label: 'Strings ending with \'ab\'',
  type: 'nfa',
  tests: [
    { id: 'empty', input: '', expected: false },
    { id: 'single-a', input: 'a', expected: false },
    { id: 'single-b', input: 'b', expected: false },
    { id: 'exact-match', input: 'ab', expected: true },
    { id: 'reversed', input: 'ba', expected: false },
    { id: 'prefix-a', input: 'aab', expected: true },
    { id: 'prefix-b', input: 'bab', expected: true },
    { id: 'suffix-a', input: 'aba', expected: false },
    { id: 'suffix-b', input: 'abb', expected: false },
    { id: 'multiple-ab', input: 'abab', expected: true },
    { id: 'long-match', input: 'bbbaaab', expected: true },
    { id: 'long-fail', input: 'bbaba', expected: false },
  ],
} satisfies ExampleMeta
