import type { AutomataScope } from '@/store/automataStore'
import { useCallback } from 'react'
import { useAutomataStore } from '@/store/automataStore'

export function useEditorState(scope: AutomataScope) {
  const value = useAutomataStore(s => s.automata[scope].editorValue)
  const errors = useAutomataStore(s => s.automata[scope].editorErrors)
  const patch = useAutomataStore(s => s.patch)

  const setEditorValue = useCallback(
    (v: string) => patch(scope, { editorValue: v }),
    [scope, patch],
  )

  const clearErrors = useCallback(
    () => patch(scope, { editorErrors: null }),
    [scope, patch],
  )

  return { value, errors, setEditorValue, clearErrors }
}
