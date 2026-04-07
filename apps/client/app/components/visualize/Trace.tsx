'use client'

import type { TraceInputToken, VisualMachine } from './TraceContext'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { Button } from '../ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '../ui/button-group'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../ui/combobox'
import { WithTooltip } from '../ui/tooltip'
import {
  useTraceInputContext,
  useTraceInteractionContext,
  useTraceSimulationContext,
} from './TraceContext'

export function Trace<M extends VisualMachine>() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { tests, input, setInput, setSelectedTest }
    = useTraceInputContext()

  const testInputs = useMemo(
    () => [...new Set(tests.map(t => t.input))],
    [tests],
  )

  const {
    machine,
    trace,
    maxStep,
    safeStep,
    current,
    isEmpty,
    isLast,
    accepted,
    getInputTokens,
    bottomPanel,
    dot,
  } = useTraceSimulationContext<M>()

  const {
    hoveredEdgeId,
    setHoveredEdgeId,
    focused,
    onFocus,
    onBlur,
    onTouchStart,
    onTouchEnd,
    stepBack,
    stepForward,
  } = useTraceInteractionContext()

  const handleTestSelect = (nextInput: string | null) => {
    const nextValue = nextInput ?? ''
    setInput(nextValue)
    const match = tests.find(t => t.input === nextValue)
    setSelectedTest(match?.id ?? '')
  }

  const tokenRows = useMemo(() => {
    const tokens
      = getInputTokens({
        input,
        current: current ?? { states: new Set<string>(), tapes: [] },
        step: safeStep,
        maxStep,
        isLast,
      }) ?? []

    const rows = new Map<number, TraceInputToken[]>()
    tokens.forEach((token) => {
      const row = token.row ?? 0
      const existing = rows.get(row) ?? []
      existing.push(token)
      rows.set(row, existing)
    })

    return [...rows.entries()].sort((a, b) => a[0] - b[0])
  }, [getInputTokens, input, current, safeStep, maxStep, isLast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value
    setInput(nextValue)
    const match = tests.find(t => t.input === nextValue)
    setSelectedTest(match?.id ?? '')
  }

  if (!machine) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-ctp-subtext0">
        Compile a machine to visualize execution.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      // Added pb-24 so the user can scroll past the bottom content, ensuring the floating button doesn't cover anything
      className="flex flex-col gap-4 md:p-4 focus:outline-none min-w-0 w-full max-w-full relative pb-24 min-h-full"
    >
      {/* Input combobox */}
      <div className="flex flex-col gap-2">
        <Combobox items={testInputs} value={input || null} onValueChange={handleTestSelect}>
          <ComboboxInput
            className="w-full **:data-[slot=input-group-control]:text-sm"
            value={input}
            onChange={handleInputChange}
            placeholder="input string"
          />
          <ComboboxContent>
            <ComboboxEmpty>No matching tests.</ComboboxEmpty>
            <ComboboxList>
              {testInput => (
                <ComboboxItem key={testInput || 'epsilon'} value={testInput}>
                  {testInput === '' ? 'ε' : testInput}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {!isEmpty && current && (
        <div className="flex flex-col items-center gap-2 py-4 bg-ctp-mantle border border-ctp-surface0 rounded-lg w-full min-w-0 overflow-x-hidden box-border">
          <div className="flex flex-col gap-1 text-lg tracking-widest w-full min-w-0 px-4 box-border">
            {tokenRows.map(([row, tokens]) => {
              const activeIndex = tokens.findIndex(token => token.isActive)
              const centeredIndex
                = activeIndex >= 0
                  ? activeIndex
                  : Math.floor(tokens.length / 2)

              return (
                <div key={row} className="flex items-center gap-2 w-full min-w-0">
                  {tokenRows.length > 1 && (
                    <span className="text-xs text-ctp-subtext1 min-w-8 text-right pr-2">
                      T
                      {row + 1}
                      :
                    </span>
                  )}
                  <div className="relative flex-1 basis-0 min-w-0 max-w-full overflow-hidden bg-ctp-crust p-1 rounded border border-ctp-surface1 h-10">
                    <div className="absolute inset-y-1 left-1/2 w-px bg-ctp-lavender/70 pointer-events-none" />
                    <div
                      className="relative left-1/2 flex transition-transform duration-150 ease-out will-change-transform"
                      style={{
                        transform: `translateX(calc(-${centeredIndex * 32 + 16}px))`,
                      }}
                    >
                      {tokens.map(token => (
                        <span
                          key={token.key}
                          className={`flex items-center justify-center w-8 h-8 font-mono text-lg rounded-sm shrink-0 ${token.className}`}
                        >
                          {token.text || '\u00A0'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-sm text-ctp-subtext0 mt-2 px-4">
            <span>
              step
              {' '}
              <span className="text-ctp-text font-bold">{safeStep}</span>
              {' '}
              /
              {' '}
              {maxStep}
            </span>
            <span className="hidden md:inline">·</span>
            <span>
              active
              {' '}
              <span className="text-ctp-lavender font-bold">
                {`{${[...current.states].join(', ')}}`}
              </span>
            </span>
          </div>
        </div>
      )}

      {bottomPanel?.({
        machine,
        current: current ?? { states: new Set<string>() },
        trace,
        step: safeStep,
        maxStep,
        isLast,
        input,
        accepted,
        dot: dot ?? '',
        hoveredEdgeId,
        setHoveredEdgeId,
      })}

      {/* Interactive Button Group (Floating/Sticky) */}
      {!isEmpty && (
        <div className="sticky bottom-6 mt-auto flex flex-col items-center gap-3 z-50 pointer-events-none">
          {!focused && (
            <p className="text-ctp-overlay0 text-xs text-center transition-opacity bg-ctp-base/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm pointer-events-auto ring-1 ring-ctp-surface1/50">
              click to focus
            </p>
          )}

          <div className="pointer-events-auto drop-shadow-xl hover:drop-shadow-2xl transition-all">
            <ButtonGroup>
              <WithTooltip shortcut={['arrowleft']}>
                <Button
                  data-slot="button"
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  onClick={stepBack}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </WithTooltip>
              <ButtonGroupSeparator />
              <WithTooltip shortcut={['arrowright']}>
                <Button
                  data-slot="button"
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  onClick={stepForward}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </WithTooltip>
            </ButtonGroup>
          </div>
        </div>
      )}
    </div>
  )
}
