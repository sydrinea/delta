'use client'

import type { TuringMachine } from '@delta/build'
import type { TraceBottomPanelContext, TraceInputArgs } from '../visualize/TraceContext'
import type { EnabledTabs, TabId, WorkbenchLogic } from './types'
import { recipes } from '@delta/examples/recipes'
import { simulateTM } from '@delta/simulator'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { useCompile } from '@/hooks/useCompile'
import { useUrlSync } from '@/hooks/useUrlSync'
import { toDotTM } from '@/lib/dot'
import { themeNames } from '@/lib/theme'
import { useTmStore } from '@/store/tmStore'
import { DeltaEditor } from '../editor'
import { useAlert } from '../providers'
import { Trace, TraceProvider, TransitionTable, useTraceInteractionContext, useTraceSimulationContext } from '../visualize'
import { useWorkbenchVariantCore } from './useWorkbenchVariantCore'
import {
  buildSlidingWindowTokens,
  buildTabs,
  makeStoreAdapters,
  TRACE_WINDOW_SIZE,
} from './utils'
import { WorkbenchShell } from './WorkbenchShell'

interface WorkbenchTMProps {
  enabledTabs?: EnabledTabs
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

const DEFAULT_TABS: EnabledTabs = {
  code: true,
  canvas: false,
  debug: true,
}

const LEADING_BRACKET_REGEX = /^\[/
const TRAILING_BRACKET_REGEX = /\]$/

function useTmWorkbenchLogic(
  enabledTabs: EnabledTabs,
  resolvedTheme: string | undefined,
  initialTab?: TabId,
  initialRecipe?: string,
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
        codeContent: <DeltaEditor scope="tm" />,
        canvasContent: (
          <div className="h-full flex items-center justify-center text-sm text-ctp-subtext0">
            Canvas is only available for NFA machines.
          </div>
        ),
        debugContent: <Trace />,
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
    initialTab,
    initialRecipe,
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

export function TMComponent({
  enabledTabs = DEFAULT_TABS,
  initialTab,
  initialRecipe,
  initialInput,
}: WorkbenchTMProps) {
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
      initialInput={initialInput}
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
      <TMWorkbenchWithTraceContext
        enabledTabs={enabledTabs}
        resolvedTheme={resolvedTheme}
        initialTab={initialTab}
        initialRecipe={initialRecipe}
      />
    </TraceProvider>
  )
}

function TMWorkbenchWithTraceContext({
  enabledTabs,
  resolvedTheme,
  initialTab,
  initialRecipe,
}: {
  enabledTabs: EnabledTabs
  resolvedTheme: string | undefined
  initialTab?: TabId
  initialRecipe?: string
}) {
  const logic = useTmWorkbenchLogic(enabledTabs, resolvedTheme, initialTab, initialRecipe)
  useUrlSync({ machineType: 'tm', activeTab: logic.activeTab, selectedRecipeKey: logic.selectedRecipeKey })
  return (
    <div className="h-full flex flex-col">
      <WorkbenchShell logic={logic} />
    </div>
  )
}
