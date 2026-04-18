import type { Edge, Node } from 'reactflow'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createHybridStorage } from './shared'

export interface NfaGraphState {
  nodes: Node[]
  edges: Edge[]
  startId: string | null
}

interface NfaGraphStore extends NfaGraphState {
  patch: (update: Partial<NfaGraphState>) => void
  patchGraph: (nodes: Node[], edges: Edge[], startId: string | null) => void
}

export const useNfaStore = create<NfaGraphStore>()(
  persist(
    set => ({
      nodes: [],
      edges: [],
      startId: null,

      patch: update =>
        set(state => ({ ...state, ...update })),

      patchGraph: (nodes, edges, startId) =>
        set(() => ({ nodes, edges, startId })),
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
