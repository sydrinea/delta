'use client'

import type { TestCase } from '@delta/examples'
import type { TestResult } from '@/hooks/useTestRunner'
import { useEffect, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { testImportExport } from '@/hooks/testImportExport'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useTestRunner } from '@/hooks/useTestRunner'
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
import { ROW_HEIGHT, TestRow } from './TestRow'
import { WithTooltip } from './tooltip'

const TESTS_PER_PAGE = 6
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
  const { showAlert } = useAlert()
  const { results, runTests, clearResults, removeResult } = useTestRunner({ tests, evaluateInput })
  const { handleTestImport, handleTestExport } = testImportExport({ tests, setTests, machineName, showAlert })

  useKeyboardShortcut([
    { shift: true, meta: true, key: 't', handler: () => runTests() },
    { meta: true, shift: true, key: 'r', handler: () => clearResults() },
  ])

  /* eslint-disable react/exhaustive-deps -- Reset triggers are external machine/recipe keys and intentionally clear prior run results. */
  useEffect(() => {
    clearResults()
  }, resetKeys)
  /* eslint-enable react/exhaustive-deps */

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
            <span className={`text-xs font-bold ${allPassed ? 'text-ctp-green' : 'text-ctp-red'}`}>
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
            <label className={cn(buttonVariants({ variant: 'info', size: 'xs' }), 'cursor-pointer')}>
              import
              <input type="file" accept=".json" className="hidden" onChange={handleTestImport} />
            </label>
          </WithTooltip>

          <WithTooltip label="Export tests to JSON">
            <Button onClick={handleTestExport} disabled={tests.length === 0} variant="mauve" size="xs">
              export
            </Button>
          </WithTooltip>

          <WithTooltip shortcut={['shift', 'cmd', 't']}>
            <Button onClick={runTests} disabled={!evaluateInput || tests.length === 0} variant="success" size="xs">
              run tests
            </Button>
          </WithTooltip>
        </div>
      </div>

      <TestCaseList
        tests={tests}
        results={results}
        onRemove={(id) => {
          setTests(tests.filter(t => t.id !== id))
          removeResult(id)
        }}
      />

      <NewTestForm
        inputPlaceholder={inputPlaceholder}
        onSubmit={(input, expected) => {
          setTests([...tests, { id: crypto.randomUUID(), input, expected }])
        }}
      />
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
      <Button onClick={() => setExpected(e => !e)} variant={expected ? 'success' : 'destructive'} size="sm">
        {expected ? 'accept' : 'reject'}
      </Button>
      <WithTooltip shortcut={['enter']}>
        <Button onClick={handleSubmit} variant="ghost" size="sm">+</Button>
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
        {rows.map(row => (
          <div
            key={row.input}
            style={{ height: ROW_HEIGHT }}
            className={`flex items-center gap-2.5 px-3.5 rounded-lg border text-sm ${
              row.passed ? 'bg-ctp-green/10 border-ctp-green/30' : 'bg-ctp-red/10 border-ctp-red/30'
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
  = | { type: 'page', page: number, key: string }
    | { type: 'ellipsis', key: string }

function TestCaseList({ tests, results, onRemove }: TestCaseListProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(tests.length / TESTS_PER_PAGE)
  const maxPage = Math.max(0, totalPages - 1)
  const safePage = Math.min(page, maxPage)
  const visibleTests = tests.slice(safePage * TESTS_PER_PAGE, (safePage + 1) * TESTS_PER_PAGE)
  const emptyRows = TESTS_PER_PAGE - visibleTests.length
  const emptyRowSlots = Array.from(
    { length: emptyRows },
    (_, offset) => safePage * TESTS_PER_PAGE + visibleTests.length + offset,
  )

  const pageTokens: PaginationToken[] = (() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => ({ type: 'page', page: index, key: `page-${index}` }))
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
        style={{ height: TESTS_PER_PAGE * ROW_HEIGHT + (TESTS_PER_PAGE - 1) * ROW_GAP }}
      >
        {visibleTests.map(test => (
          <TestRow key={test.id} test={test} result={results[test.id]} onRemove={onRemove} />
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
                    if (safePage > 0)
                      setPage(safePage - 1)
                  }}
                  className={cn('text-ctp-subtext0 hover:text-ctp-text', safePage === 0 && 'pointer-events-none opacity-50')}
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
                          className={cn('font-semibold text-ctp-subtext0 hover:text-ctp-text', token.page === safePage && 'text-ctp-text')}
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
                    if (safePage < maxPage)
                      setPage(safePage + 1)
                  }}
                  className={cn('text-ctp-subtext0 hover:text-ctp-text', safePage === maxPage && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
