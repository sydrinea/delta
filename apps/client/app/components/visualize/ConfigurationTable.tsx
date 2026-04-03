'use client'

import type { TraceStep } from './TraceContext'
import { useEffect, useMemo } from 'react'
import { useScrollableTable } from './hooks/useScrollableTable'

interface ConfigurationTableProps {
  trace: TraceStep[]
  step: number
  input: string
  isLast: boolean
  accepted: boolean
}

export function ConfigurationTable({
  trace,
  step,
  input,
  isLast,
  accepted,
}: ConfigurationTableProps) {
  const { scrollContainerRef, rowRef, scrollRowToCenter }
    = useScrollableTable()

  const configurations = useMemo(() => {
    // Only show configurations up to the current step
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
    // Scroll to the most recent step whenever it changes
    scrollRowToCenter(step.toString())
  }, [step, scrollRowToCenter])

  if (configurations.length === 0) {
    return null
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-ctp-surface0 bg-ctp-mantle flex flex-col">
      <div className="px-3 py-2 min-h-10.5 border-b border-ctp-surface0 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-ctp-subtext0">
          trace
        </p>
        {isLast && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              accepted ? 'text-ctp-green' : 'text-ctp-red'
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
        <table className="w-full min-w-max text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-ctp-crust/80 backdrop-blur-sm text-ctp-subtext0 z-10">
            <tr>
              <th className="px-3 py-2 border-b border-ctp-surface1 w-12">
                Step
              </th>
              <th className="px-3 py-2 border-b border-ctp-surface1">
                Configuration
              </th>
            </tr>
          </thead>
          <tbody>
            {configurations.map((config) => {
              const isCurrent = config.index === step
              const rowClassName = isCurrent ? 'bg-ctp-green/20' : ''
              const prefix = config.index > 0 ? '⊢ ' : '  '

              return (
                <tr
                  key={config.index}
                  ref={(element) => {
                    rowRef.current[config.index.toString()] = element
                  }}
                  className={rowClassName}
                >
                  <td className="px-3 py-1.5 border-b border-ctp-surface0 text-ctp-mauve font-semibold w-12">
                    {config.index}
                  </td>
                  <td className="px-3 py-1.5 border-b border-ctp-surface0 text-ctp-text whitespace-nowrap font-mono">
                    <span className="text-ctp-subtext1 mr-2 inline-block w-4 text-center">
                      {prefix}
                    </span>
                    (
                    <span className="text-ctp-mauve">
                      {`{${config.states.join(', ')}}`}
                    </span>
                    ,
                    {' '}
                    <span className="text-ctp-green">
                      {config.remainingInput}
                    </span>
                    )
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
