import type { TestCase } from '@delta/examples'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTestRunner } from '../app/hooks/use-test-runner'

const tests: TestCase[] = [
  { id: 'a', input: 'aa', expected: true },
  { id: 'b', input: 'ab', expected: false },
  { id: 'c', input: '', expected: true },
]

describe('useTestRunner', () => {
  it('starts with empty results', () => {
    const { result } = renderHook(() => useTestRunner({ tests }))
    expect(result.current.results).toEqual({})
  })

  it('runTests populates results for each test case', () => {
    const evaluateInput = vi.fn((input: string) => input.length % 2 === 0)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    expect(Object.keys(result.current.results)).toHaveLength(3)
  })

  it('runTests marks passing cases as passed', () => {
    const evaluateInput = vi.fn((input: string) => input.length % 2 === 0)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    // 'aa' length 2 (even) → actual true, expected true → passed
    expect(result.current.results.a.passed).toBe(true)
    // 'ab' length 2 (even) → actual true, expected false → failed
    expect(result.current.results.b.passed).toBe(false)
    // '' length 0 (even) → actual true, expected true → passed
    expect(result.current.results.c.passed).toBe(true)
  })

  it('runTests records the actual value', () => {
    const evaluateInput = vi.fn(() => false)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    expect(result.current.results.a.actual).toBe(false)
  })

  it('runTests does nothing when evaluateInput is undefined', () => {
    const { result } = renderHook(() => useTestRunner({ tests }))
    act(() => result.current.runTests())
    expect(result.current.results).toEqual({})
  })

  it('clearResults resets to empty', () => {
    const evaluateInput = vi.fn(() => true)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    expect(Object.keys(result.current.results).length).toBeGreaterThan(0)
    act(() => result.current.clearResults())
    expect(result.current.results).toEqual({})
  })

  it('removeResult removes only the targeted entry', () => {
    const evaluateInput = vi.fn(() => true)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    act(() => result.current.removeResult('b'))
    expect(result.current.results.b).toBeUndefined()
    expect(result.current.results.a).toBeDefined()
    expect(result.current.results.c).toBeDefined()
  })

  it('evaluateInput is called once per test case', () => {
    const evaluateInput = vi.fn(() => true)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    expect(evaluateInput).toHaveBeenCalledTimes(tests.length)
  })

  it('evaluateInput is called with the correct input values', () => {
    const evaluateInput = vi.fn<(input: string) => boolean>(() => true)
    const { result } = renderHook(() => useTestRunner({ tests, evaluateInput }))
    act(() => result.current.runTests())
    const calledWith = evaluateInput.mock.calls.map(([input]) => input)
    expect(calledWith).toEqual(tests.map(t => t.input))
  })
})
