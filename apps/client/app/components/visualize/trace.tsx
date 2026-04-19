'use client'

import type { MachineType } from '@/lib/worker/protocol'
import { simulate as simulateNFA, simulatePDA, simulateTM } from '@delta/simulator'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { useCompiledMachine } from '@/hooks/use-compiled-machine'
import { useTestSuite } from '@/hooks/use-test-suite'
import { useSimulatorStore } from '@/store/simulator-store'
import { Surface } from '../ui'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../ui/combobox'
import { WORKBENCH_CONFIGS } from '../workbench/workbench-configs'
import { InputTape } from './input-tape'
import { PlaybackControls } from './playback-controls'

interface TraceProps {
  scope: MachineType
  readonly?: boolean
  className?: string
}

export function Trace({ scope, readonly, className }: TraceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  const machine = useCompiledMachine(scope) as any
  const { tests } = useTestSuite(scope)

  const input = useSimulatorStore(s => s.input)
  const setInput = useSimulatorStore(s => s.setInput)
  const setTrace = useSimulatorStore(s => s.setTrace)
  const setAccepted = useSimulatorStore(s => s.setAccepted)
  const step = useSimulatorStore(s => s.step)
  const trace = useSimulatorStore(s => s.trace)
  const setStep = useSimulatorStore(s => s.setStep)

  const testInputs = useMemo(
    () => [...new Set(tests.map(t => t.input))],
    [tests],
  )

  const config = WORKBENCH_CONFIGS[scope]
  const BottomPanel = config.bottomPanel as any

  useEffect(() => {
    if (!machine)
      return

    // Run simulation when input changes
    let result: any
    if (scope === 'nfa') {
      const res = simulateNFA(machine, input)
      result = { accepted: res.accepted, trace: res.trace.map(s => ({ states: s.states })) }
    }
    else if (scope === 'pda') {
      const res = simulatePDA(machine, input, { maxSteps: Math.max(1000, input.length * 100) })
      result = { accepted: res.accepted, trace: res.trace.map(s => ({ states: s.states, configurations: s.configurations })) }
    }
    else if (scope === 'tm') {
      const res = simulateTM(machine, input, { maxSteps: Math.max(1000, input.length * 100) })
      result = { accepted: res.accepted, trace: res.trace.map(s => ({ states: s.states, tapes: s.tapes })) }
    }

    setTrace(result.trace)
    setAccepted(result.accepted)
    setStep(0)
  }, [machine, input, scope, setTrace, setAccepted, setStep])

  const handleTestSelect = (nextInput: string | null) => {
    setInput(nextInput ?? '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  if (!machine) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Compile a machine to visualize execution.
      </div>
    )
  }

  const current = trace[step]
  const isEmpty = input === ''

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn('flex flex-col gap-4 md:p-4 focus:outline-none min-w-0 w-full max-w-full relative pb-24 min-h-full', className)}
    >
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
        <Surface className="flex flex-col items-center gap-2 py-4 w-full min-w-0 overflow-x-hidden box-border">
          <InputTape scope={scope} />

          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-sm text-muted-foreground mt-2 px-4">
            <span>
              step
              {' '}
              <span className="text-foreground font-bold">{step}</span>
              {' '}
              /
              {' '}
              {Math.max(0, trace.length - 1)}
            </span>
            <span className="hidden md:inline">·</span>
            <span>
              active
              {' '}
              <span className="text-primary font-bold">
                {`{${[...current.states].join(', ')}}`}
              </span>
            </span>
          </div>
        </Surface>
      )}

      {BottomPanel && <BottomPanel />}

      {!isEmpty && !readonly && (
        <div className="sticky bottom-6 mt-auto flex flex-col items-center gap-3 z-50 pointer-events-none">
          {!focused && (
            <p className="text-muted-foreground text-xs text-center transition-opacity bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm pointer-events-auto ring-1 ring-panel-border/50">
              click to focus
            </p>
          )}
          <PlaybackControls focused={focused} />
        </div>
      )}
    </div>
  )
}
