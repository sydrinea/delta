'use client'

import type { TestCase } from '@delta/examples'
import { TestCaseArraySchema } from '@delta/examples'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useAlert } from '../providers'
import { Badge } from './badge'
import { Button, buttonVariants } from './button'
import { Input } from './input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'
import { WithTooltip } from './tooltip'

interface TestResult {
  id: string
  passed: boolean
  actual: boolean
}

const TESTS_PER_PAGE = 6
const ROW_HEIGHT = 42
const ROW_GAP = 6

interface TestSuiteProps {
  tests: TestCase[]
  setTests: (tests: TestCase[]) => void
  evaluateInput?: (input: string) => boolean
  machineName?: string
  resetKeys?: unknown[]
  inputPlaceholder?: string
}

export function TestSuite({
  tests,
  setTests,
  evaluateInput,
  machineName = 'delta',
  resetKeys,
  inputPlaceholder = 'input string',
}: TestSuiteProps) {
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const { showAlert } = useAlert()

  const runTests = () => {
    if (!evaluateInput)
      return

    const newResults: Record<string, TestResult> = {}
    for (const test of tests) {
      const actual = evaluateInput(test.input)
      newResults[test.id] = {
        id: test.id,
        passed: actual === test.expected,
        actual,
      }
    }
    setResults(newResults)
  }

  useKeyboardShortcut([
    {
      shift: true,
      meta: true,
      key: 't',
      handler: () => runTests(),
    },
    {
      meta: true,
      shift: true,
      key: 'r',
      handler: () => setResults({}),
    },
  ])

  /* eslint-disable react/set-state-in-effect, react/exhaustive-deps -- Reset triggers are external machine/recipe keys and intentionally clear prior run results. */
  useEffect(() => {
    setResults({})
  }, resetKeys)
  /* eslint-enable react/set-state-in-effect, react/exhaustive-deps */

  const handleTestImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const result = TestCaseArraySchema.safeParse(parsed)
        if (!result.success) {
          showAlert({
            title: 'Invalid Test Format',
            message: `Expected an array of { input: string, expected: boolean }.\n\n${result.error.issues.map(i => i.message).join('\n')}`,
          })
          return
        }
        setTests(result.data.map(t => ({ ...t, id: crypto.randomUUID() })))
      }
      catch {
        showAlert({
          title: 'Invalid JSON',
          message: 'The selected file is not valid JSON.',
        })
      }
    }

    reader.readAsText(file)
    e.target.value = ''
  }

  const handleTestExport = () => {
    if (tests.length === 0)
      return

    const exportData = tests.map(({ input, expected }) => ({
      input,
      expected,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${machineName || 'delta'}_tests.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const hasResults = Object.keys(results).length > 0
  const allPassed = hasResults && tests.every(t => results[t.id]?.passed)
  const passCount = tests.filter(t => results[t.id]?.passed).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ctp-subtext0 text-xs uppercase tracking-widest">
            test suite
          </span>
          {hasResults && (
            <span
              className={`text-xs font-bold ${allPassed ? 'text-ctp-green' : 'text-ctp-red'}`}
            >
              (
              {passCount}
              {' '}
              of
              {' '}
              {tests.length}
              )
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <WithTooltip label="Import tests from JSON">
            <label
              className={cn(
                buttonVariants({ variant: 'info', size: 'xs' }),
                'cursor-pointer',
              )}
            >
              import
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleTestImport}
              />
            </label>
          </WithTooltip>

          <WithTooltip label="Export tests to JSON">
            <Button
              onClick={handleTestExport}
              disabled={tests.length === 0}
              variant="mauve"
              size="xs"
            >
              export
            </Button>
          </WithTooltip>

          <WithTooltip shortcut={['shift', 'cmd', 't']}>
            <Button
              onClick={runTests}
              disabled={!evaluateInput || tests.length === 0}
              variant="success"
              size="xs"
            >
              run tests
            </Button>
          </WithTooltip>
        </div>
      </div>

      <TestCaseList
        tests={tests}
        results={results}
        onRemove={(id) => {
          const updated = tests.filter(t => t.id !== id)
          setTests(updated)
          setResults((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          })
        }}
      />

      <NewTestForm
        inputPlaceholder={inputPlaceholder}
        onSubmit={(input, expected) => {
          const id = crypto.randomUUID()
          setTests([...tests, { id, input, expected }])
        }}
      />
    </div>
  )
}

interface TestProps {
  result?: TestResult
  test: TestCase
  onRemove: (id: string) => void
}

function Test({ result, test, onRemove }: TestProps) {
  return (
    <div
      style={{ height: ROW_HEIGHT }}
      className={`flex items-center gap-2.5 px-3.5 rounded-lg border text-sm transition-colors ${
        result
          ? result.passed
            ? 'bg-ctp-green/10 border-ctp-green/30'
            : 'bg-ctp-red/10 border-ctp-red/30'
          : 'bg-ctp-mantle border-ctp-subtext0/25'
      }`}
    >
      <span className="flex-1 truncate">
        {test.input || <span className="text-ctp-overlay0">ε</span>}
      </span>
      <Badge variant={test.expected ? 'success' : 'destructive'}>
        {test.expected ? 'accept' : 'reject'}
      </Badge>
      <Button
        onClick={() => onRemove(test.id)}
        variant="ghost"
        size="icon-touch"
        className="ml-1 text-ctp-overlay0 hover:text-ctp-red"
        aria-label="Delete test"
      >
        <Trash2 className="text-ctp-red h-4" />
      </Button>
    </div>
  )
}

interface NewTestFormProps {
  onSubmit: (input: string, expected: boolean) => void
  inputPlaceholder: string
}

function NewTestForm({ onSubmit, inputPlaceholder }: NewTestFormProps) {
  const [input, setInput] = useState('')
  const [expected, setExpected] = useState(true)

  const handleSubmit = () => {
    onSubmit(input, expected)
    setInput('')
  }

  return (
    <div className="flex items-center gap-2 border-t border-ctp-subtext0/25 pt-3">
      <Input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder={inputPlaceholder}
        className="flex-1"
      />
      <Button
        onClick={() => setExpected(e => !e)}
        variant={expected ? 'success' : 'destructive'}
        size="sm"
      >
        {expected ? 'accept' : 'reject'}
      </Button>
      <WithTooltip shortcut={['enter']}>
        <Button
          onClick={handleSubmit}
          variant="ghost"
          size="sm"
        >
          +
        </Button>
      </WithTooltip>
    </div>
  )
}

interface TestSuitePreviewRow {
  input: string
  expected: boolean
  passed: boolean
}

interface TestSuitePreviewProps {
  rows: TestSuitePreviewRow[]
  className?: string
}

export function TestSuitePreview({ rows, className }: TestSuitePreviewProps) {
  const passCount = rows.filter(r => r.passed).length

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2">
        <span className="text-ctp-subtext0 text-xs uppercase tracking-widest">test suite</span>
        <span className={`text-xs font-bold ${passCount === rows.length ? 'text-ctp-green' : 'text-ctp-red'}`}>
          (
          {passCount}
          {' '}
          of
          {' '}
          {rows.length}
          )
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <div
            key={i}
            style={{ height: ROW_HEIGHT }}
            className={`flex items-center gap-2.5 px-3.5 rounded-lg border text-sm ${
              row.passed
                ? 'bg-ctp-green/10 border-ctp-green/30'
                : 'bg-ctp-red/10 border-ctp-red/30'
            }`}
          >
            <span className="flex-1 truncate font-mono">
              {row.input || <span className="text-ctp-overlay0">ε</span>}
            </span>
            <Badge variant={row.expected ? 'success' : 'destructive'}>
              {row.expected ? 'accept' : 'reject'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TestCaseListProps {
  tests: TestCase[]
  results: Record<string, TestResult>
  onRemove: (id: string) => void
}

type PaginationToken
  = { type: 'page', page: number, key: string }
    | { type: 'ellipsis', key: string }

function TestCaseList({ tests, results, onRemove }: TestCaseListProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(tests.length / TESTS_PER_PAGE)
  const maxPage = Math.max(0, totalPages - 1)
  const safePage = Math.min(page, maxPage)
  const visibleTests = tests.slice(
    safePage * TESTS_PER_PAGE,
    (safePage + 1) * TESTS_PER_PAGE,
  )
  const emptyRows = TESTS_PER_PAGE - visibleTests.length
  const emptyRowSlots = Array.from(
    { length: emptyRows },
    (_, offset) => safePage * TESTS_PER_PAGE + visibleTests.length + offset,
  )
  const pageTokens: PaginationToken[] = (() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => ({
        type: 'page',
        page: index,
        key: `page-${index}`,
      }))
    }

    if (safePage <= 1) {
      return [
        { type: 'page', page: 0, key: 'page-0' },
        { type: 'page', page: 1, key: 'page-1' },
        { type: 'page', page: 2, key: 'page-2' },
        { type: 'ellipsis', key: 'ellipsis-trailing' },
        { type: 'page', page: maxPage, key: `page-${maxPage}` },
      ]
    }

    if (safePage >= maxPage - 1) {
      return [
        { type: 'page', page: 0, key: 'page-0' },
        { type: 'ellipsis', key: 'ellipsis-leading' },
        { type: 'page', page: maxPage - 2, key: `page-${maxPage - 2}` },
        { type: 'page', page: maxPage - 1, key: `page-${maxPage - 1}` },
        { type: 'page', page: maxPage, key: `page-${maxPage}` },
      ]
    }

    return [
      { type: 'page', page: 0, key: 'page-0' },
      { type: 'ellipsis', key: 'ellipsis-leading' },
      { type: 'page', page: safePage, key: `page-${safePage}` },
      { type: 'ellipsis', key: 'ellipsis-trailing' },
      { type: 'page', page: maxPage, key: `page-${maxPage}` },
    ]
  })()

  return (
    <>
      <div
        className="flex flex-col gap-1.5"
        style={{
          height: TESTS_PER_PAGE * ROW_HEIGHT + (TESTS_PER_PAGE - 1) * ROW_GAP,
        }}
      >
        {visibleTests.map(test => (
          <Test
            key={test.id}
            test={test}
            result={results[test.id]}
            onRemove={onRemove}
          />
        ))}

        {emptyRowSlots.map(slot => (
          <div
            key={`empty-${slot}`}
            style={{ height: ROW_HEIGHT }}
            className="rounded-lg border border-dashed border-ctp-subtext0/25 bg-ctp-base/30"
          />
        ))}
      </div>

      <div className="flex items-center justify-center">
        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text=""
                  aria-disabled={safePage === 0}
                  tabIndex={safePage === 0 ? -1 : 0}
                  onClick={(event) => {
                    event.preventDefault()
                    if (safePage === 0)
                      return
                    setPage(Math.max(safePage - 1, 0))
                  }}
                  className={cn(
                    'text-ctp-subtext0 hover:text-ctp-text',
                    safePage === 0 && 'pointer-events-none opacity-50',
                  )}
                />
              </PaginationItem>

              {pageTokens.map(token => (
                token.type === 'ellipsis'
                  ? (
                      <PaginationItem key={token.key}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  : (
                      <PaginationItem key={token.key}>
                        <PaginationLink
                          href="#"
                          isActive={token.page === safePage}
                          aria-label={`Go to page ${token.page + 1}`}
                          onClick={(event) => {
                            event.preventDefault()
                            setPage(token.page)
                          }}
                          className={cn(
                            'font-semibold text-ctp-subtext0 hover:text-ctp-text',
                            token.page === safePage && 'text-ctp-text',
                          )}
                        >
                          {token.page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  text=""
                  aria-disabled={safePage === maxPage}
                  tabIndex={safePage === maxPage ? -1 : 0}
                  onClick={(event) => {
                    event.preventDefault()
                    if (safePage === maxPage)
                      return
                    setPage(Math.min(safePage + 1, maxPage))
                  }}
                  className={cn(
                    'text-ctp-subtext0 hover:text-ctp-text',
                    safePage === maxPage && 'pointer-events-none opacity-50',
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
