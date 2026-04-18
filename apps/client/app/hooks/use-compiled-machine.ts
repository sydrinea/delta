import type { MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automata-store'
import { useAutomataStore } from '@/store/automata-store'

export function useCompiledMachine<M extends AnyMachine>(scope: MachineType): M | null {
  return useAutomataStore(s => s.automata[scope].machine) as M | null
}
