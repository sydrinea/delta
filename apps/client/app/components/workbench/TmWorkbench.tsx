'use client'

import type { TuringMachine } from '@delta/build'
import type { EnabledTabs, WorkbenchLogic } from './types'
import type { TraceBottomPanelContext, TraceInputArgs } from '@/components/visualize/TraceContext'
import { recipes } from '@delta/examples/recipes'
import { simulateTM } from '@delta/simulator'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { useAlert } from '@/components/AlertProvider'
import { DeltaEditor } from '@/components/editor/DeltaEditor'
import { Trace } from '@/components/visualize/Trace'
import {

  TraceProvider,
  useTraceInteractionContext,
  useTraceSimulationContext,
} from '@/components/visualize/TraceContext'
import { TransitionTable } from '@/components/visualize/TransitionTable'
import { useCompile } from '@/hooks/useCompile'
import { toDotTM } from '@/lib/dot'
import { themeNames } from '@/lib/theme'
import { useTmStore } from '@/store/tmStore'
import { useWorkbenchVariantCore } from './useWorkbenchVariantCore'
import {
  buildSlidingWindowTokens,
  buildTabs,
  makeStoreAdapters,
  TRACE_WINDOW_SIZE,
} from './utils'
import { WorkbenchScaffold } from './WorkbenchScaffold'

interface TmWorkbenchProps {
  enabledTabs?: EnabledTabs
}

const DEFAULT_TABS: EnabledTabs = {
  editor: true,
  canvas: false,
  visualizer: true,
}

const LEADING_BRACKET_REGEX = /^\[/
const TRAILING_BRACKET_REGEX = /\]$/

function useTmWorkbenchLogic(
  enabledTabs: EnabledTabs,
  resolvedTheme: string | undefined,
): WorkbenchLogic<TuringMachine> {
  const machine = useTmStore(s => s.machine)
  const editorValue = useTmStore(s => s.editorValue)
  const tests = useTmStore(s => s.tests)
  const editorErrors = useTmStore(s => s.editorErrors)
  const patchTm = useTmStore(s => s.patch)
  const { showAlert } = useAlert()

  const compile = useCompile('tm')
  const { dot: activeDot } = useTraceSimulationContext<TuringMachine>()
  const { setHoveredEdgeId } = useTraceInteractionContext()
  const adapters = useMemo(() => makeStoreAdapters(patchTm), [patchTm])

  const tabs = useMemo(
    () =>
      buildTabs({
        editorContent: <DeltaEditor scope="tm" />,
        canvasContent: (
          <div className="h-full flex items-center justify-center text-sm text-ctp-subtext0">
            Canvas is only available for NFA machines.
          </div>
        ),
        visualizerContent: <Trace />,
      }),
    [],
  )

  const core = useWorkbenchVariantCore<TuringMachine>({
    enabledTabs,
    tabs,
    machine,
    recipesMap: recipes.tm,
    machineType: 'tm',
    editorValue,
    adapters,
    compile,
    showAlert,
    dotFromMachine: toDotTM,
    activeDot,
    resolvedTheme,
  })

  return {
    ...core.base,
    machine,
    editorErrors,
    editorValue,
    compile,
    tests,
    setTests: adapters.setTests,
    simulate: (targetMachine, input) =>
      simulateTM(targetMachine, input, {
        maxSteps: Math.max(1000, input.length * 100),
      }).accepted,
    graphvizOnEdgeHover: setHoveredEdgeId,
  }
}

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
        if (cell === undefined) {
          return null
        }

        const symbol = cell
          .replace(LEADING_BRACKET_REGEX, '')
          .replace(TRAILING_BRACKET_REGEX, '')
        return {
          text: symbol,
          row,
          isActive: slotIndex === halfWindow,
          className:
            slotIndex === halfWindow
              ? 'text-ctp-mauve font-bold bg-ctp-surface0 ring-1 ring-ctp-mauve'
              : 'text-ctp-text',
        }
      },
    }).map(token => ({ ...token, row }))
  })
}

function TmWorkbenchInner({
  enabledTabs,
  resolvedTheme,
}: {
  enabledTabs: EnabledTabs
  resolvedTheme: string | undefined
}) {
  const logic = useTmWorkbenchLogic(enabledTabs, resolvedTheme)
  return <WorkbenchScaffold logic={logic} />
}

export function TmWorkbench({ enabledTabs = DEFAULT_TABS }: TmWorkbenchProps) {
  const machine = useTmStore(s => s.machine)
  const tests = useTmStore(s => s.tests)
  const { resolvedTheme } = useTheme()
  const theme = themeNames[resolvedTheme ?? 'light']

  return (
    <TraceProvider<TuringMachine>
      machine={machine}
      tests={tests}
      simulate={(currentMachine, input) =>
        simulateTM(currentMachine, input, {
          maxSteps: Math.max(1000, input.length * 100),
        })}
      getDot={(currentMachine, states) =>
        toDotTM(currentMachine, theme, states)}
      getInputTokens={getTmInputTokens}
      bottomPanel={({
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
      )}
    >
      <TmWorkbenchInner
        enabledTabs={enabledTabs}
        resolvedTheme={resolvedTheme}
      />
    </TraceProvider>
  )
}
