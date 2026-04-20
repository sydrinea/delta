import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEditorState } from '../app/hooks/use-editor-state'
import { useAutomataStore } from '../app/store/automata-store'

vi.mock('../app/store/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../app/store/shared')>()
  const { createJSONStorage } = await import('zustand/middleware')
  return {
    ...actual,
    createHybridStorage: () => createJSONStorage(() => sessionStorage),
  }
})

beforeEach(() => {
  useAutomataStore.setState(useAutomataStore.getInitialState())
})

describe('useEditorState', () => {
  it('returns the current editorValue from the store', () => {
    useAutomataStore.getState().patch('nfa', { editorValue: 'initial code' })
    const { result } = renderHook(() => useEditorState('nfa'))
    expect(result.current.value).toBe('initial code')
  })

  it('setEditorValue updates the store for the correct scope', () => {
    const { result } = renderHook(() => useEditorState('nfa'))
    act(() => result.current.setEditorValue('new nfa code'))
    expect(useAutomataStore.getState().automata.nfa.editorValue).toBe('new nfa code')
  })

  it('setEditorValue for pda does not affect nfa scope', () => {
    const nfaBefore = useAutomataStore.getState().automata.nfa.editorValue
    const { result } = renderHook(() => useEditorState('pda'))
    act(() => result.current.setEditorValue('pda code'))
    expect(useAutomataStore.getState().automata.nfa.editorValue).toBe(nfaBefore)
    expect(useAutomataStore.getState().automata.pda.editorValue).toBe('pda code')
  })

  it('returned value updates reactively when store changes', () => {
    const { result } = renderHook(() => useEditorState('nfa'))
    act(() => result.current.setEditorValue('updated'))
    expect(result.current.value).toBe('updated')
  })

  it('clearErrors sets editorErrors to null', () => {
    useAutomataStore.getState().patch('nfa', { editorErrors: [{ message: 'err', line: 1, column: 0 }] })
    const { result } = renderHook(() => useEditorState('nfa'))
    expect(result.current.errors).toHaveLength(1)
    act(() => result.current.clearErrors())
    expect(useAutomataStore.getState().automata.nfa.editorErrors).toBeNull()
  })

  it('errors reflects the current store errors', () => {
    const errors = [{ message: 'oops', line: 2, column: 5 }]
    useAutomataStore.getState().patch('tm', { editorErrors: errors })
    const { result } = renderHook(() => useEditorState('tm'))
    expect(result.current.errors).toEqual(errors)
  })
})
