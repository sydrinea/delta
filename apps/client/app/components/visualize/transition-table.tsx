'use client'

import type { TuringMachine } from '@delta/build'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulator-store'
import { useCompiledMachine } from '@/hooks/use-compiled-machine'
import {
  activeTupleFromTapes,
  buildTMTransitionRows,
  formatReadTuple,
} from '@/lib/tm-metadata'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Surface, LabelText } from '../ui'
import { useScrollableTable } from './hooks/use-scrollable-table'

type TMTableMode = 'all' | 'state'

export function TransitionTable() {
  const machine = useCompiledMachine('tm') as TuringMachine<number> | null
  const trace = useSimulatorStore(s => s.trace)
  const step = useSimulatorStore(s => s.step)
  const current = trace[step] ?? { states: new Set<string>() }
  const hoveredEdgeId = useSimulatorStore(s => s.hoveredEdgeId)
  const accepted = useSimulatorStore(s => s.accepted)
  const isLast = trace.length > 0 && step === trace.length - 1

  const [tableMode, setTableMode] = useState<TMTableMode>('state')

  const { scrollContainerRef, rowRef, scrollRowToCenter }
    = useScrollableTable()

  const transitionRows = useMemo(() => {
    if (!machine) return []
    return buildTMTransitionRows(machine)
  }, [machine])

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
    <Surface className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl flex flex-col">
      <div className="px-3 py-2 min-h-10.5 border-b border-panel-border flex items-center justify-between gap-2">
        <LabelText>
          Transitions
        </LabelText>
        <div className="flex items-center gap-3">
          {isLast && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                accepted ? 'text-success' : 'text-destructive'
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
        <Table className="w-full min-w-max">
          <TableHeader className="sticky top-0 z-raised">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              {Array.from({ length: machine?.tapeCount ?? 1 }, (_, index) => (
                <TableHead
                  key={`tape-col-${index}`}
                >
                  Tape
                  {' '}
                  {index + 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row: ReturnType<typeof buildTMTransitionRows>[number]) => {
              const isHovered = row.edgeId === hoveredEdgeId
              const isCurrent = isCurrentTransition(row)
              const rowClassName = isCurrent
                ? 'bg-success/20'
                : isHovered
                  ? 'bg-panel-border/70'
                  : ''

              return (
                <TableRow
                  key={row.id}
                  ref={(element) => {
                    rowRef.current[row.id] = element
                  }}
                  className={rowClassName}
                >
                  <TableCell className="text-primary font-semibold">
                    {row.id}
                  </TableCell>
                  <TableCell>
                    {row.fromState}
                  </TableCell>
                  <TableCell>
                    {row.toState}
                  </TableCell>
                  {Array.from({ length: machine?.tapeCount ?? 1 }, (_, index) => {
                    const read = row.readSymbols[index] ?? '_'
                    const write = row.writeSymbols[index] ?? read
                    const direction = row.directions[index] ?? 'S'

                    return (
                      <TableCell
                        key={`${row.id}-tape-${index}`}
                        className="text-muted-foreground"
                      >
                        <span className="text-foreground">{read}</span>
                        <span className="px-1">-&gt;</span>
                        <span className="text-foreground">{write}</span>
                        <span className="pl-1 text-primary">{direction}</span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}

            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3 + (machine?.tapeCount ?? 1)}
                  className="py-4 text-center text-muted-foreground"
                >
                  {tableMode === 'state'
                    ? 'No transitions from the current state.'
                    : 'No transitions available.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-3 py-2 border-t border-panel-border text-[11px] text-muted-foreground">
        {tableMode === 'state' && currentReadTuple
          ? `state ${currentState ?? '?'} · read ${formatReadTuple(currentReadTuple)}`
          : `${transitionRows.length} transitions`}
      </div>
    </Surface>
  )
}
