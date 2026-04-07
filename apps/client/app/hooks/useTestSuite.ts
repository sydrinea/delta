import type { TestCase } from '@delta/examples'
import type { AutomataScope } from '@/store/automataStore'
import { useCallback } from 'react'
import { useAutomataStore } from '@/store/automataStore'

export function useTestSuite(scope: AutomataScope) {
  const tests = useAutomataStore(s => s.automata[scope].tests)
  const patch = useAutomataStore(s => s.patch)

  const setTests = useCallback(
    (next: TestCase[]) => patch(scope, { tests: next }),
    [scope, patch],
  )

  return { tests, setTests }
}
