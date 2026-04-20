import { beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('useAutomataStore', () => {
  describe('initial state', () => {
    it('has non-empty editorValue for all scopes', () => {
      const { automata } = useAutomataStore.getState()
      expect(automata.nfa.editorValue.length).toBeGreaterThan(0)
      expect(automata.pda.editorValue.length).toBeGreaterThan(0)
      expect(automata.tm.editorValue.length).toBeGreaterThan(0)
    })

    it('starts with null machine for all scopes', () => {
      const { automata } = useAutomataStore.getState()
      expect(automata.nfa.machine).toBeNull()
      expect(automata.pda.machine).toBeNull()
      expect(automata.tm.machine).toBeNull()
    })

    it('starts with default tests for each scope', () => {
      const { automata } = useAutomataStore.getState()
      expect(automata.nfa.tests.length).toBeGreaterThan(0)
      expect(automata.pda.tests.length).toBeGreaterThan(0)
      expect(automata.tm.tests.length).toBeGreaterThan(0)
    })
  })

  describe('patch', () => {
    it('updates editorValue for the targeted scope', () => {
      useAutomataStore.getState().patch('nfa', { editorValue: 'new nfa code' })
      expect(useAutomataStore.getState().automata.nfa.editorValue).toBe('new nfa code')
    })

    it('does not affect other scopes when patching one', () => {
      const before = useAutomataStore.getState().automata
      useAutomataStore.getState().patch('nfa', { editorValue: 'changed' })
      const after = useAutomataStore.getState().automata
      expect(after.pda.editorValue).toBe(before.pda.editorValue)
      expect(after.tm.editorValue).toBe(before.tm.editorValue)
    })

    it('accumulates sequential patches on the same scope', () => {
      const { patch } = useAutomataStore.getState()
      patch('pda', { editorValue: 'first' })
      patch('pda', { editorValue: 'second' })
      expect(useAutomataStore.getState().automata.pda.editorValue).toBe('second')
    })

    it('can patch machine and editorErrors independently', () => {
      const fakeMachine = { name: 'test' } as any
      const { patch } = useAutomataStore.getState()
      patch('tm', { machine: fakeMachine })
      expect(useAutomataStore.getState().automata.tm.machine).toEqual(fakeMachine)
      patch('tm', { editorErrors: [{ message: 'err', line: 1, column: 0 }] })
      expect(useAutomataStore.getState().automata.tm.machine).toEqual(fakeMachine)
      expect(useAutomataStore.getState().automata.tm.editorErrors).toHaveLength(1)
    })

    it('can patch all three scopes without interference', () => {
      const { patch } = useAutomataStore.getState()
      patch('nfa', { editorValue: 'nfa-val' })
      patch('pda', { editorValue: 'pda-val' })
      patch('tm', { editorValue: 'tm-val' })
      const { automata } = useAutomataStore.getState()
      expect(automata.nfa.editorValue).toBe('nfa-val')
      expect(automata.pda.editorValue).toBe('pda-val')
      expect(automata.tm.editorValue).toBe('tm-val')
    })
  })
})
