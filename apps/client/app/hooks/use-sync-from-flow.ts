import type { Edge, Node } from 'reactflow'
import { useCallback } from 'react'
import { flowToCode } from '@/lib/flow/from-flow'
import { useAutomataStore } from '@/store/automata-store'
import { useNfaStore } from '@/store/nfa-store'
import { useCompile } from './use-compile'

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
