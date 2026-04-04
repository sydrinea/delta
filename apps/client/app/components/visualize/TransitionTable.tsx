'use client'

import type { TuringMachine } from '@delta/build'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { useScrollableTable } from './hooks/useScrollableTable'
import {
  activeTupleFromTapes,
  buildTMTransitionRows,
  formatReadTuple,
} from './metadata'

interface TransitionTableCurrentStep {
  states: Set<string>
  tapes?: string[][]
}

interface TransitionTableProps {
  machine: TuringMachine<any>
  current: TransitionTableCurrentStep
  hoveredEdgeId: string | null
  isLast: boolean
  accepted: boolean
}

type TMTableMode = 'all' | 'state'

export function TransitionTable({
  machine,
  current,
  hoveredEdgeId,
  isLast,
  accepted,
}: TransitionTableProps) {
  const [tableMode, setTableMode] = useState<TMTableMode>('state')
  const { scrollContainerRef, rowRef, scrollRowToCenter }
    = useScrollableTable()

  const transitionRows = useMemo(
    () => buildTMTransitionRows(machine),
    [machine],
  )

  const currentState = useMemo(() => {
    const states = [...current.states].sort()
    return states[0] ?? null
  }, [current])

  const currentReadTuple = useMemo(
    () => activeTupleFromTapes(current.tapes),
    [current],
  )

  const stateRelevantRows = useMemo(() => {
    if (!currentState) {
      return []
    }

    return transitionRows.filter((row): row is ReturnType<typeof buildTMTransitionRows>[number] => row.fromState === currentState)
  }, [transitionRows, currentState])

  const visibleRows = tableMode === 'all' ? transitionRows : stateRelevantRows

  const isCurrentTransition = useCallback((
    row: (typeof transitionRows)[number],
  ): boolean => {
    if (!currentState || !currentReadTuple) {
      return false
    }

    if (row.fromState !== currentState) {
      return false
    }

    if (row.readSymbols.length !== currentReadTuple.length) {
      return false
    }

    return row.readSymbols.every(
      (symbol: string, index: number) => symbol === currentReadTuple[index],
    )
  }, [currentReadTuple, currentState])

  useEffect(() => {
    if (!hoveredEdgeId) {
      return
    }

    const hoveredRow = visibleRows.find((row): row is ReturnType<typeof buildTMTransitionRows>[number] => row.edgeId === hoveredEdgeId)
    if (!hoveredRow) {
      return
    }

    scrollRowToCenter(hoveredRow.id)
  }, [hoveredEdgeId, scrollRowToCenter, visibleRows])

  useEffect(() => {
    const activeRow = visibleRows.find((row): row is ReturnType<typeof buildTMTransitionRows>[number] => isCurrentTransition(row))
    if (!activeRow) {
      return
    }

    scrollRowToCenter(activeRow.id)
  }, [isCurrentTransition, scrollRowToCenter, visibleRows])

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-ctp-surface0 bg-ctp-mantle flex flex-col">
      <div className="px-3 py-2 min-h-10.5 border-b border-ctp-surface0 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-ctp-subtext0">
          transitions
        </p>
        <div className="flex items-center gap-3">
          {isLast && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                accepted ? 'text-ctp-green' : 'text-ctp-red'
              }`}
            >
              {accepted ? '✓ accepted' : '✗ rejected'}
            </span>
          )}
          <Tabs
            value={tableMode}
            onValueChange={value => setTableMode(value as TMTableMode)}
          >
            <TabsList className="gap-4">
              <TabsTrigger value="state">
                state
              </TabsTrigger>
              <TabsTrigger value="all">
                all
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-96 w-full relative"
      >
        <table className="w-full min-w-max text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-ctp-crust/80 backdrop-blur-sm text-ctp-subtext0">
            <tr>
              <th className="px-2 py-2 border-b border-ctp-surface1">ID</th>
              <th className="px-2 py-2 border-b border-ctp-surface1">From</th>
              <th className="px-2 py-2 border-b border-ctp-surface1">To</th>
              {Array.from({ length: machine.tapeCount }, (_, index) => (
                <th
                  key={`tape-col-${index}`}
                  className="px-2 py-2 border-b border-ctp-surface1"
                >
                  Tape
                  {' '}
                  {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row: ReturnType<typeof buildTMTransitionRows>[number]) => {
              const isHovered = row.edgeId === hoveredEdgeId
              const isCurrent = isCurrentTransition(row)
              const rowClassName = isCurrent
                ? 'bg-ctp-green/20'
                : isHovered
                  ? 'bg-ctp-surface0/70'
                  : ''

              return (
                <tr
                  key={row.id}
                  ref={(element) => {
                    rowRef.current[row.id] = element
                  }}
                  className={rowClassName}
                >
                  <td className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-mauve font-semibold">
                    {row.id}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-text">
                    {row.fromState}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-text">
                    {row.toState}
                  </td>
                  {Array.from({ length: machine.tapeCount }, (_, index) => {
                    const read = row.readSymbols[index] ?? '_'
                    const write = row.writeSymbols[index] ?? read
                    const direction = row.directions[index] ?? 'S'

                    return (
                      <td
                        key={`${row.id}-tape-${index}`}
                        className="px-2 py-1.5 border-b border-ctp-surface0 text-ctp-subtext1"
                      >
                        <span className="text-ctp-text">{read}</span>
                        <span className="px-1">-&gt;</span>
                        <span className="text-ctp-text">{write}</span>
                        <span className="pl-1 text-ctp-mauve">{direction}</span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={3 + machine.tapeCount}
                  className="px-2 py-4 text-center text-ctp-subtext0"
                >
                  {tableMode === 'state'
                    ? 'No transitions from the current state.'
                    : 'No transitions available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-ctp-surface0 text-[11px] text-ctp-subtext1">
        {tableMode === 'state' && currentReadTuple
          ? `state ${currentState ?? '?'} · read ${formatReadTuple(currentReadTuple)}`
          : `${transitionRows.length} transitions`}
      </div>
    </div>
  )
}
