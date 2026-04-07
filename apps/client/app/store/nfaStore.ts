import type { NFA } from '@delta/build'
import type { Edge, Node } from 'reactflow'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { flowToCode } from '@/lib/flow/fromFlow'
import { runCode } from '@/lib/runCode'
import { MachineTypes } from '@/lib/worker/protocol'
import { useAutomataStore } from './automataStore'
import { createHybridStorage } from './shared'

export interface NfaGraphState {
  nodes: Node[]
  edges: Edge[]
  startId: string | null
}

interface NfaGraphStore extends NfaGraphState {
  patch: (update: Partial<NfaGraphState>) => void
  syncFromFlow: (nodes: Node[], edges: Edge[], startId: string | null) => void
}

export const useNfaStore = create<NfaGraphStore>()(
  persist(
    set => ({
      nodes: [],
      edges: [],
      startId: null,

      patch: update =>
        set(state => ({ ...state, ...update })),

      syncFromFlow: (nodes, edges, startId) => {
        const code = flowToCode(nodes, edges, startId)
        set(state => ({ ...state, nodes, edges, startId }))

        const { patch: patchAutomata } = useAutomataStore.getState()
        patchAutomata('nfa', { editorValue: code })

        runCode<NFA>(
          code,
          MachineTypes.NFA,
          machine => patchAutomata('nfa', { machine }),
          errors => patchAutomata('nfa', { editorErrors: errors }),
        )
      },
    }),
    {
      name: 'delta-nfa-store',
      storage: createHybridStorage(),
      partialize: state => ({
        nodes: state.nodes,
        edges: state.edges,
        startId: state.startId,
      }),
    },
  ),
)
