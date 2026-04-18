import type { TestCase } from '@delta/examples'
import { useState } from 'react'

export interface TestResult {
  id: string
  passed: boolean
  actual: boolean
}

interface UseTestRunnerOptions {
  tests: TestCase[]
  evaluateInput?: (input: string) => boolean
}

export function useTestRunner({ tests, evaluateInput }: UseTestRunnerOptions) {
  const [results, setResults] = useState<Record<string, TestResult>>({})

  const runTests = () => {
    if (!evaluateInput)
      return

    const newResults: Record<string, TestResult> = {}
    for (const test of tests) {
      const actual = evaluateInput(test.input)
      newResults[test.id] = { id: test.id, passed: actual === test.expected, actual }
    }
    setResults(newResults)
  }

  const clearResults = () => setResults({})

  const removeResult = (id: string) => {
    setResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return { results, runTests, clearResults, removeResult }
}
