'use client'

import type { TestCase } from '@delta/examples'
import type { TestResult } from '@/hooks/use-test-runner'
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
            ? 'bg-success/10 border-success/30'
            : 'bg-destructive/10 border-destructive/30'
          : 'bg-panel border-muted-foreground/25'
      }`}
    >
      <span className="flex-1 truncate">
        {test.input || <span className="text-muted-foreground">ε</span>}
      </span>
      <Badge variant={test.expected ? 'success' : 'destructive'}>
        {test.expected ? 'accept' : 'reject'}
      </Badge>
      <Button
        onClick={() => onRemove(test.id)}
        variant="ghost"
        size="icon-touch"
        className="ml-1 text-muted-foreground hover:text-destructive"
        aria-label="Delete test"
      >
        <Trash2 className="text-destructive h-4" />
      </Button>
    </div>
  )
}

export { ROW_HEIGHT }
