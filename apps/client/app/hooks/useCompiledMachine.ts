import type { NFA, TuringMachine } from '@delta/build'
import type { AutomataScope } from '@/store/automataStore'
import { useAutomataStore } from '@/store/automataStore'

export function useCompiledMachine<M extends NFA | TuringMachine>(scope: AutomataScope): M | null {
  return useAutomataStore(s => s.automata[scope].machine) as M | null
}
