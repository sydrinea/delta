import type { TestCase } from '@delta/examples'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTestSuite } from '../app/hooks/use-test-suite'
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

const customTests: TestCase[] = [
  { id: 'x1', input: 'foo', expected: true },
  { id: 'x2', input: 'bar', expected: false },
]

describe('useTestSuite', () => {
  it('returns the current tests from the store for the given scope', () => {
    const defaultTests = useAutomataStore.getState().automata.nfa.tests
    const { result } = renderHook(() => useTestSuite('nfa'))
    expect(result.current.tests).toEqual(defaultTests)
  })

  it('reads tests for the correct scope', () => {
    const nfaTests = useAutomataStore.getState().automata.nfa.tests
    const pdaTests = useAutomataStore.getState().automata.pda.tests
    const { result: nfaResult } = renderHook(() => useTestSuite('nfa'))
    const { result: pdaResult } = renderHook(() => useTestSuite('pda'))
    expect(nfaResult.current.tests).toEqual(nfaTests)
    expect(pdaResult.current.tests).toEqual(pdaTests)
  })

  it('setTests patches the automata store for the correct scope', () => {
    const { result } = renderHook(() => useTestSuite('nfa'))
    act(() => result.current.setTests(customTests))
    expect(useAutomataStore.getState().automata.nfa.tests).toEqual(customTests)
  })

  it('setTests for nfa does not affect pda tests', () => {
    const pdaBefore = useAutomataStore.getState().automata.pda.tests
    const { result } = renderHook(() => useTestSuite('nfa'))
    act(() => result.current.setTests(customTests))
    expect(useAutomataStore.getState().automata.pda.tests).toEqual(pdaBefore)
  })

  it('tests value updates reactively after setTests', () => {
    const { result } = renderHook(() => useTestSuite('nfa'))
    act(() => result.current.setTests(customTests))
    expect(result.current.tests).toEqual(customTests)
  })

  it('setTests replaces tests entirely (not appends)', () => {
    const { result } = renderHook(() => useTestSuite('tm'))
    act(() => result.current.setTests(customTests))
    expect(result.current.tests).toHaveLength(customTests.length)
  })

  it('setTests with empty array clears all tests', () => {
    const { result } = renderHook(() => useTestSuite('nfa'))
    act(() => result.current.setTests([]))
    expect(useAutomataStore.getState().automata.nfa.tests).toEqual([])
  })
})
