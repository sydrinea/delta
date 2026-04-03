import type { ExampleMeta } from '../schemas'

export default {
  label: 'Binary Palindrome',
  type: 'tm',
  tests: [
    { id: 'pal-empty', input: '', expected: true },
    { id: 'pal-single-0', input: '0', expected: true },
    { id: 'pal-single-1', input: '1', expected: true },
    { id: 'pal-even-true', input: '1001', expected: true },
    { id: 'pal-even-false', input: '1010', expected: false },
    { id: 'pal-odd-true', input: '10101', expected: true },
    { id: 'pal-odd-false', input: '10010', expected: false },
    { id: 'pal-long-true', input: '11011011', expected: true },
  ],
} satisfies ExampleMeta
