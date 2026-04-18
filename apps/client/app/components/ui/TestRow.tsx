'use client'

import type { TestCase } from '@delta/examples'
import type { TestResult } from '@/hooks/useTestRunner'
import { Trash2 } from 'lucide-react'
import { Badge } from './badge'
import { Button } from './button'

const ROW_HEIGHT = 42

interface TestRowProps {
  test: TestCase
  result?: TestResult
  onRemove: (id: string) => void
}

export function TestRow({ result, test, onRemove }: TestRowProps) {
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

export { ROW_HEIGHT }
