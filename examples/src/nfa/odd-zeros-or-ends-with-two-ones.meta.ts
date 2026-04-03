import type { ExampleMeta } from '../schemas'

export default {
  label: 'Odd Zeros or Ends With Two Ones',
  type: 'nfa',
  tests: [
    { id: 'oztwo-1', input: '0', expected: true },
    { id: 'oztwo-2', input: '000', expected: true },
    { id: 'oztwo-3', input: '00000', expected: true },
    { id: 'oztwo-4', input: '00', expected: false },
    { id: 'oztwo-5', input: '0000', expected: false },
    { id: 'oztwo-6', input: '11', expected: true },
    { id: 'oztwo-7', input: '011', expected: true },
    { id: 'oztwo-8', input: '111', expected: true },
    { id: 'oztwo-9', input: '0011', expected: true },
    { id: 'oztwo-10', input: '10011', expected: true },
    { id: 'oztwo-11', input: '00011', expected: true },
    { id: 'oztwo-12', input: '', expected: false },
    { id: 'oztwo-13', input: '1', expected: false },
    { id: 'oztwo-14', input: '10', expected: false },
    { id: 'oztwo-15', input: '01', expected: false },
    { id: 'oztwo-16', input: '010', expected: false },
    { id: 'oztwo-17', input: '0110', expected: false },
  ],
} satisfies ExampleMeta
