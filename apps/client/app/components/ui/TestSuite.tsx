'use client'

import type { TestCase } from '@delta/examples'
import type { TestResult } from '@/hooks/use-test-runner'
import type { MachineType } from '@/lib/worker/protocol'
import { useCompiledMachine } from '@/hooks/use-compiled-machine'
import { useTestSuite } from '@/hooks/use-test-suite'
import { useWorkbenchStore } from '@/store/workbench-store'
import { WORKBENCH_CONFIGS } from '../workbench/workbench-configs'
import { useEffect, useState } from 'react'

import { cn } from '@/app/lib/utils'
import { testImportExport } from '@/hooks/test-import-export'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { useTestRunner } from '@/hooks/use-test-runner'
import { useAlert } from '../providers'
import { Badge } from './badge'
import { LabelText } from './label-text'
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
import { ROW_HEIGHT, TestRow } from './test-row'
import { WithTooltip } from './tooltip'

const TESTS_PER_PAGE = 6
const ROW_GAP = 6

interface TestSuiteProps {
  scope: MachineType
  inputPlaceholder?: string
}

export function TestSuite({
  scope,
  inputPlaceholder = 'input string',
}: TestSuiteProps) {
  const machine = useCompiledMachine(scope) as any
  const { tests, setTests } = useTestSuite(scope)
  const selectedRecipeKey = useWorkbenchStore(s => s.selectedRecipeKey)
  const config = WORKBENCH_CONFIGS[scope]
  
  const machineName = machine?.name ?? 'delta'
  const resetKeys = [machine, selectedRecipeKey]
  const evaluateInput = machine ? (input: string) => config.simulate(machine as any, input).accepted : undefined

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
          <LabelText>
            Test Suite
          </LabelText>
          {hasResults && (
            <span className={`text-xs font-bold ${allPassed ? 'text-success' : 'text-destructive'}`}>
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
    <div className="flex items-center gap-2 border-t border-muted-foreground/25 pt-3">
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
        <LabelText>test suite</LabelText>
        <span className={`text-xs font-bold ${passCount === rows.length ? 'text-success' : 'text-destructive'}`}>
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
              row.passed ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
            }`}
          >
            <span className="flex-1 truncate font-mono">
              {row.input || <span className="text-muted-foreground">ε</span>}
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
            className="rounded-lg border border-dashed border-muted-foreground/25 bg-background/30"
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
                  className={cn('text-muted-foreground hover:text-foreground', safePage === 0 && 'pointer-events-none opacity-50')}
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
                          className={cn('font-semibold text-muted-foreground hover:text-foreground', token.page === safePage && 'text-foreground')}
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
                  className={cn('text-muted-foreground hover:text-foreground', safePage === maxPage && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
