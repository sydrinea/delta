import type { MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automataStore'
import { useCallback } from 'react'
import { runCode } from '@/lib/runCode'
import { useAutomataStore } from '@/store/automataStore'

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
