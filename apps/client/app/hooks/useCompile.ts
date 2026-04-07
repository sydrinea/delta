import type { NFA, TuringMachine } from '@delta/build'
import type { AutomataScope } from '@/store/automataStore'
import { useCallback } from 'react'
import { runCode } from '@/lib/runCode'
import { useAutomataStore } from '@/store/automataStore'

export function useCompile(scope: AutomataScope) {
  const patch = useAutomataStore(s => s.patch)

  return useCallback(
    (code: string) =>
      runCode<NFA | TuringMachine>(
        code,
        scope,
        machine => patch(scope, { machine }),
        errors => patch(scope, { editorErrors: errors }),
      ),
    [scope, patch],
  )
}
