import type { MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automata-store'
import { useCallback } from 'react'
import { runCode } from '@/lib/run-code'
import { useAutomataStore } from '@/store/automata-store'

export function useCompile(scope: MachineType) {
  const patch = useAutomataStore(s => s.patch)

  return useCallback(
    (code: string) =>
      runCode<AnyMachine>(
        code,
        scope,
        machine => patch(scope, { machine }),
        errors => patch(scope, { editorErrors: errors }),
      ),
    [scope, patch],
  )
}
