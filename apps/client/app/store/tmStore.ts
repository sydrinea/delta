import type { TuringMachine } from '@delta/build'
import type { TestCase } from '@delta/examples'
import type { SlicePatch } from './shared'
import type { ExecutionError } from '@/lib/runCode'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultTM } from '@/lib/defaults'
import { applyPatch, createHybridStorage } from './shared'

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

export interface TmState {
  editorValue: string
  tests: TestCase[]
  machine: TuringMachine | null
  editorErrors: ExecutionError[] | null
}

interface TmStore extends TmState {
  patch: (patch: SlicePatch<TmState>) => void
}

export const useTmStore = create<TmStore>()(
  persist(
    set => ({
      editorValue: defaultTM,
      tests: DEFAULT_TM_TESTS,
      machine: null,
      editorErrors: [],

      patch: patch =>
        set(state => ({
          ...applyPatch<TmState>(state, patch),
        })),
    }),
    {
      name: 'delta-tm-store',
      storage: createHybridStorage(),
      partialize: state => ({
        editorValue: state.editorValue,
        tests: state.tests,
      }),
    },
  ),
)
