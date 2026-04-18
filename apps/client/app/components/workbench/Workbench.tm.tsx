'use client'

import type { TuringMachine } from '@delta/build'
import type { TraceBottomPanelContext, TraceInputArgs } from '../visualize/TraceContext'
import type { MachineWorkbenchConfig } from './MachineWorkbench'
import type { EnabledTabs, TabId } from './types'
import { recipes } from '@delta/examples/recipes'
import { simulateTM } from '@delta/simulator'
import { tmDotConfig } from '@/lib/dot'
import { TransitionTable } from '../visualize'
import { MachineWorkbench } from './MachineWorkbench'
import {
  buildSlidingWindowTokens,
  TRACE_WINDOW_SIZE,
} from './utils'

const LEADING_BRACKET_REGEX = /^\[/
const TRAILING_BRACKET_REGEX = /\]$/

// Multi-tape variant — for single-stream machines see buildSingleStreamInputTokens in utils.ts
function getTmInputTokens(args: TraceInputArgs) {
  const halfWindow = Math.floor(TRACE_WINDOW_SIZE / 2)
  const tapes = args.current.tapes ?? []

  return tapes.flatMap((tape: string[], row: number) => {
    const activeTapeIndex = tape.findIndex(
      (cell: string) => cell.startsWith('[') && cell.endsWith(']'),
    )

    return buildSlidingWindowTokens({
      centerIndex: activeTapeIndex,
      windowSize: TRACE_WINDOW_SIZE,
      makeKey: (charIndex, slotIndex) => `t${row}-${slotIndex}-${charIndex}`,
      resolveToken: (charIndex, slotIndex) => {
        const cell = tape[charIndex]
        if (cell === undefined)
          return null

        const symbol = cell
          .replace(LEADING_BRACKET_REGEX, '')
          .replace(TRAILING_BRACKET_REGEX, '')
        return {
          text: symbol,
          row,
          isActive: slotIndex === halfWindow,
          className: slotIndex === halfWindow
            ? 'text-ctp-lavender font-bold bg-ctp-surface0 ring-1 ring-ctp-lavender'
            : 'text-ctp-text',
        }
      },
    }).map(token => ({ ...token, row }))
  })
}

const tmConfig: MachineWorkbenchConfig<TuringMachine> = {
  scope: 'tm',
  defaultTabs: { code: true, canvas: false, debug: true },
  recipesMap: recipes.tm,
  simulate: (machine, input) => {
    const result = simulateTM(machine, input, {
      maxSteps: Math.max(1000, input.length * 100),
    })
    return {
      accepted: result.accepted,
      halted: result.halted,
      exceededStepLimit: result.exceededStepLimit,
      trace: result.trace.map(s => ({ states: s.states, tapes: s.tapes })),
    }
  },
  dotConfig: tmDotConfig,
  getInputTokens: getTmInputTokens,
  bottomPanel: ({
    machine: currentMachine,
    current,
    hoveredEdgeId,
    isLast,
    accepted,
  }: TraceBottomPanelContext<TuringMachine>) => (
    <TransitionTable
      machine={currentMachine}
      current={current}
      hoveredEdgeId={hoveredEdgeId}
      isLast={isLast}
      accepted={accepted}
    />
  ),
}

interface WorkbenchTMProps {
  enabledTabs?: EnabledTabs
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

export function TMComponent({
  enabledTabs,
  initialTab,
  initialRecipe,
  initialInput,
}: WorkbenchTMProps) {
  return (
    <MachineWorkbench
      config={tmConfig}
      enabledTabs={enabledTabs}
      initialTab={initialTab}
      initialRecipe={initialRecipe}
      initialInput={initialInput}
    />
  )
}
