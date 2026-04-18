import type { MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automataStore'
import { useAutomataStore } from '@/store/automataStore'

export function useCompiledMachine<M extends AnyMachine>(scope: MachineType): M | null {
  return useAutomataStore(s => s.automata[scope].machine) as M | null
}
