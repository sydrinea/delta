'use client'

import type { ReactNode } from 'react'
import type { TraceStep } from '@/store/simulator-store'
import { useEffect, useMemo } from 'react'
import { useSimulatorStore } from '@/store/simulator-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Surface, LabelText } from '../ui'
import { useScrollableTable } from './hooks/use-scrollable-table'

interface ExtraColumn {
  header: ReactNode
  cell: (step: TraceStep, index: number) => ReactNode
}

interface ConfigurationTableProps {
  extraColumns?: ExtraColumn[]
}

export function ConfigurationTable({
  extraColumns = [],
}: ConfigurationTableProps = {}) {
  const trace = useSimulatorStore(s => s.trace)
  const step = useSimulatorStore(s => s.step)
  const input = useSimulatorStore(s => s.input)
  const accepted = useSimulatorStore(s => s.accepted)
  const isLast = trace.length > 0 && step === trace.length - 1

  const { scrollContainerRef, rowRef, scrollRowToCenter }
    = useScrollableTable()


  const configurations = useMemo(() => {
    const currentTrace = trace.slice(0, step + 1)

    return currentTrace
      .map((t, index) => {
        const remainingInput = input.slice(index)
        return {
          index,
          states: [...t.states].sort(),
          remainingInput: remainingInput === '' ? 'ε' : remainingInput,
        }
      })
      .reverse() // Most recent at the top
  }, [trace, step, input])

  useEffect(() => {
    scrollRowToCenter(step.toString())
  }, [step, scrollRowToCenter])

  if (configurations.length === 0) {
    return null
  }

  return (
    <Surface className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl flex flex-col">
      <div className="px-3 py-2 min-h-10.5 border-b border-panel-border flex items-center justify-between gap-2">
        <LabelText>
          Configurations
        </LabelText>
        {isLast && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              accepted ? 'text-success' : 'text-destructive'
            }`}
          >
            {accepted ? '✓ accepted' : '✗ rejected'}
          </span>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-96 w-full relative"
      >
        <Table className="w-full min-w-max">
          <TableHeader className="sticky top-0 z-raised">
            <TableRow>
              <TableHead className="w-12">
                Step
              </TableHead>
              <TableHead>
                Configuration
              </TableHead>
              {extraColumns.map((col, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <TableHead key={i}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {configurations.map((config) => {
              const isCurrent = config.index === step
              const rowClassName = isCurrent ? 'bg-success/20' : ''
              const prefix = config.index > 0 ? '⊢ ' : '  '

              return (
                <TableRow
                  key={config.index}
                  ref={(element) => {
                    rowRef.current[config.index.toString()] = element
                  }}
                  className={rowClassName}
                >
                  <TableCell className="w-12 text-primary font-semibold">
                    {config.index}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono">
                    <span className="text-muted-foreground mr-2 inline-block w-4 text-center">
                      {prefix}
                    </span>
                    (
                    <span className="text-primary">
                      {`{${config.states.join(', ')}}`}
                    </span>
                    ,
                    {' '}
                    <span className="text-success">
                      {config.remainingInput}
                    </span>
                    )
                  </TableCell>
                  {extraColumns.map((col, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <TableCell key={i}>
                      {col.cell(trace[config.index]!, config.index)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Surface>
  )
}
