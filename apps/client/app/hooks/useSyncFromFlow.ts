import type { Edge, Node } from 'reactflow'
import { useCallback } from 'react'
import { flowToCode } from '@/lib/flow/fromFlow'
import { useAutomataStore } from '@/store/automataStore'
import { useNfaStore } from '@/store/nfaStore'
import { useCompile } from './useCompile'

export function useSyncFromFlow() {
  const patchGraph = useNfaStore(s => s.patchGraph)
  const patchAutomata = useAutomataStore(s => s.patch)
  const compile = useCompile('nfa')

  return useCallback(
    (nodes: Node[], edges: Edge[], startId: string | null) => {
      const code = flowToCode(nodes, edges, startId)
      patchGraph(nodes, edges, startId)
      patchAutomata('nfa', { editorValue: code })
      compile(code)
    },
    [patchGraph, patchAutomata, compile],
  )
}
