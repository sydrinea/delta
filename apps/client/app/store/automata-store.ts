import type { NFA, PDA, TuringMachine } from '@delta/build'
import type { TestCase } from '@delta/examples'
import type { ExecutionError } from '@/lib/run-code'
import type { MachineType } from '@/lib/worker/protocol'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultNFA, defaultPDA, defaultTM } from '@/lib/defaults'
import { applyPatch, createHybridStorage } from './shared'

export type AnyMachine = NFA | PDA | TuringMachine

export interface AutomataState {
  editorValue: string
  tests: TestCase[]
  machine: AnyMachine | null
  editorErrors: ExecutionError[] | null
}

interface AutomataStore {
  automata: Record<MachineType, AutomataState>
  patch: (scope: MachineType, update: Partial<AutomataState>) => void
}

const DEFAULT_NFA_TESTS: TestCase[] = [
  { id: crypto.randomUUID(), input: '', expected: true },
  { id: crypto.randomUUID(), input: 'a', expected: false },
  { id: crypto.randomUUID(), input: 'aa', expected: true },
  { id: crypto.randomUUID(), input: 'aaa', expected: true },
  { id: crypto.randomUUID(), input: 'abababaaa', expected: true },
  { id: crypto.randomUUID(), input: 'abababbaa', expected: false },
]

const DEFAULT_TM_TESTS: TestCase[] = [
  { id: 'empty', input: '', expected: true },
  { id: 'single-0', input: '0', expected: true },
  { id: 'single-1', input: '1', expected: true },
  { id: 'double-00', input: '00', expected: true },
  { id: 'double-11', input: '11', expected: true },
  { id: 'even-bad', input: '01', expected: false },
  { id: 'odd-good', input: '010', expected: true },
  { id: 'odd-bad', input: '001', expected: false },
  { id: 'long-good', input: '011110', expected: true },
  { id: 'long-bad', input: '011010', expected: false },
]

const DEFAULT_PDA_TESTS: TestCase[] = [
  { id: crypto.randomUUID(), input: '', expected: true },
  { id: crypto.randomUUID(), input: 'ab', expected: true },
  { id: crypto.randomUUID(), input: 'aabb', expected: true },
  { id: crypto.randomUUID(), input: 'aaabbb', expected: true },
  { id: crypto.randomUUID(), input: 'a', expected: false },
  { id: crypto.randomUUID(), input: 'aab', expected: false },
]

const DEFAULT_AUTOMATA_STATE: Record<MachineType, AutomataState> = {
  nfa: {
    editorValue: defaultNFA,
    tests: DEFAULT_NFA_TESTS,
    machine: null,
    editorErrors: [],
  },
  pda: {
    editorValue: defaultPDA,
    tests: DEFAULT_PDA_TESTS,
    machine: null,
    editorErrors: [],
  },
  tm: {
    editorValue: defaultTM,
    tests: DEFAULT_TM_TESTS,
    machine: null,
    editorErrors: [],
  },
}

export const useAutomataStore = create<AutomataStore>()(
  persist(
    set => ({
      automata: DEFAULT_AUTOMATA_STATE,

      patch: (scope, update) =>
        set(state => ({
          automata: {
            ...state.automata,
            [scope]: applyPatch(state.automata[scope], update),
          },
        })),
    }),
    {
      name: 'delta-automata-store',
      storage: createHybridStorage(),
      partialize: state => ({
        automata: {
          nfa: {
            editorValue: state.automata.nfa.editorValue,
            tests: state.automata.nfa.tests,
          },
          pda: {
            editorValue: state.automata.pda.editorValue,
            tests: state.automata.pda.tests,
          },
          tm: {
            editorValue: state.automata.tm.editorValue,
            tests: state.automata.tm.tests,
          },
        },
      }),
    },
  ),
)
