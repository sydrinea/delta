import type { ExampleMeta } from '../schemas'

export default {
  label: 'Equal number of a\'s and b\'s (aⁿbⁿ)',
  type: 'pda',
  tests: [
    { id: 'empty', input: '', expected: true },
    { id: 'ab', input: 'ab', expected: true },
    { id: 'aabb', input: 'aabb', expected: true },
    { id: 'aaabbb', input: 'aaabbb', expected: true },
    { id: 'aaaabbbb', input: 'aaaabbbb', expected: true },
    { id: 'a-only', input: 'a', expected: false },
    { id: 'b-only', input: 'b', expected: false },
    { id: 'aab', input: 'aab', expected: false },
    { id: 'abb', input: 'abb', expected: false },
    { id: 'ba', input: 'ba', expected: false },
    { id: 'abab', input: 'abab', expected: false },
    { id: 'aabbb', input: 'aabbb', expected: false },
  ],
} satisfies ExampleMeta
