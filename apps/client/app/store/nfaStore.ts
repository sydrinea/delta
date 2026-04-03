import type { NFA } from '@delta/build'
import type { TestCase } from '@delta/examples'
import type { Edge, Node } from 'reactflow'
import type { SlicePatch } from './shared'
import type { ExecutionError } from '@/lib/runCode'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultNFA } from '@/lib/defaults'
import { flowToCode } from '@/lib/flow/fromFlow'
import { runCode } from '@/lib/runCode'
import { MachineTypes } from '@/lib/worker/protocol'
import { applyPatch, createHybridStorage } from './shared'

const DEFAULT_NFA_TESTS: TestCase[] = [
  { id: crypto.randomUUID(), input: '', expected: true },
  { id: crypto.randomUUID(), input: 'a', expected: false },
  { id: crypto.randomUUID(), input: 'aa', expected: true },
  { id: crypto.randomUUID(), input: 'aaa', expected: true },
  { id: crypto.randomUUID(), input: 'abababaaa', expected: true },
  { id: crypto.randomUUID(), input: 'abababbaa', expected: false },
]

export interface NfaState {
  editorValue: string
  tests: TestCase[]
  nodes: Node[]
  edges: Edge[]
  startId: string | null
  machine: NFA | null
  editorErrors: ExecutionError[] | null
}

interface NfaStore extends NfaState {
  patch: (patch: SlicePatch<NfaState>) => void
  syncFromFlow: (nodes: Node[], edges: Edge[], startId: string | null) => void
}

export const useNfaStore = create<NfaStore>()(
  persist(
    set => ({
      editorValue: defaultNFA,
      tests: DEFAULT_NFA_TESTS,
      nodes: [],
      edges: [],
      startId: null,
      machine: null,
      editorErrors: [],

      patch: patch =>
        set(state => ({
          ...applyPatch<NfaState>(state, patch),
        })),

      syncFromFlow: (nodes, edges, startId) => {
        const code = flowToCode(nodes, edges, startId)

        set(state => ({
          ...state,
          nodes,
          edges,
          startId,
          editorValue: code,
        }))

        runCode<NFA>(
          code,
          MachineTypes.NFA,
          machine =>
            set(state => ({
              ...state,
              machine,
            })),
          err =>
            set(state => ({
              ...state,
              editorErrors: err,
            })),
        )
      },
    }),
    {
      name: 'delta-nfa-store',
      storage: createHybridStorage(),
      partialize: state => ({
        editorValue: state.editorValue,
        tests: state.tests,
        nodes: state.nodes,
        edges: state.edges,
        startId: state.startId,
      }),
    },
  ),
)
