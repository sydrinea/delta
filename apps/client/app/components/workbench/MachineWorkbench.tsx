'use client'

import type { ReactNode } from 'react'
import type { TraceBottomPanelContext, TraceInputArgs, TraceInputToken, TraceSimulationResult } from '../visualize/TraceContext'
import type { EnabledTabs, Recipe, TabGuardResult, TabId, WorkbenchLogic } from './types'
import type { DotConfig, DotMachineBase } from '@/lib/dot'
import type { MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automataStore'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { useCompiledMachine } from '@/hooks/useCompiledMachine'
import { useEditorState } from '@/hooks/useEditorState'
import { useTestSuite } from '@/hooks/useTestSuite'
import { useUrlSync } from '@/hooks/useUrlSync'
import { toDot } from '@/lib/dot'
import { themeNames } from '@/lib/theme'
import { DeltaEditor } from '../editor'
import { useAlert } from '../providers'
import { Trace, TraceProvider, useTraceInteractionContext, useTraceSimulationContext } from '../visualize'
import { useWorkbenchCore } from './useWorkbenchCore'
import { buildTabs } from './utils'
import { WorkbenchShell } from './WorkbenchShell'

export interface MachineWorkbenchConfig<M extends DotMachineBase> {
  scope: MachineType
  defaultTabs: EnabledTabs
  recipesMap: Record<string, Recipe>
  /** Canvas panel content. Defaults to a "not available" placeholder. */
  canvasContent?: ReactNode
  /**
   * Full simulation function whose result is used for trace visualization and
   * test suite evaluation. Must return `{ accepted, trace }` at minimum.
   */
  simulate: (machine: M, input: string) => TraceSimulationResult
  dotConfig: DotConfig<M>
  getInputTokens: (args: TraceInputArgs) => TraceInputToken[]
  bottomPanel?: (ctx: TraceBottomPanelContext<M>) => ReactNode
  /**
   * Called when a tab change is requested with the pending tab, the current
   * machine, and the current editor value. Return a `TabGuardResult` to block
   * and show a confirmation, or `null` to allow immediately.
   */
  tabGuard?: (tab: TabId, ctx: { machine: M | null, editorValue: string }) => TabGuardResult | null
  onRecipeLoaded?: (args: { activeTab: TabId, setActiveTab: (tab: TabId) => void }) => void
}

interface MachineWorkbenchProps<M extends DotMachineBase> {
  config: MachineWorkbenchConfig<M>
  enabledTabs?: EnabledTabs
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

export function MachineWorkbench<M extends DotMachineBase & AnyMachine>({
  config,
  enabledTabs = config.defaultTabs,
  initialTab,
  initialRecipe,
  initialInput,
}: MachineWorkbenchProps<M>) {
  const machine = useCompiledMachine<M>(config.scope)
  const { tests } = useTestSuite(config.scope)
  const { resolvedTheme } = useTheme()
  const theme = themeNames[resolvedTheme ?? 'light']

  return (
    <TraceProvider<M>
      machine={machine}
      tests={tests}
      simulate={config.simulate}
      getDot={(m, states) => toDot(m, config.dotConfig, theme, states)}
      getInputTokens={config.getInputTokens}
      bottomPanel={config.bottomPanel}
      initialInput={initialInput}
    >
      <MachineWorkbenchInner
        config={config}
        enabledTabs={enabledTabs}
        resolvedTheme={resolvedTheme}
        initialTab={initialTab}
        initialRecipe={initialRecipe}
      />
    </TraceProvider>
  )
}

function MachineWorkbenchInner<M extends DotMachineBase & AnyMachine>({
  config,
  enabledTabs,
  resolvedTheme,
  initialTab,
  initialRecipe,
}: {
  config: MachineWorkbenchConfig<M>
  enabledTabs: EnabledTabs
  resolvedTheme: string | undefined
  initialTab?: TabId
  initialRecipe?: string
}) {
  const machine = useCompiledMachine<M>(config.scope)
  const { errors: editorErrors } = useEditorState(config.scope)
  const { tests, setTests } = useTestSuite(config.scope)
  const { showAlert } = useAlert()
  const { dot: activeDot } = useTraceSimulationContext<M>()
  const { setHoveredEdgeId } = useTraceInteractionContext()

  const tabs = useMemo(() => buildTabs({
    codeContent: <DeltaEditor scope={config.scope} />,
    canvasContent: config.canvasContent ?? (
      <div className="h-full flex items-center justify-center text-sm text-ctp-subtext0">
        Canvas is only available for NFA machines.
      </div>
    ),
    debugContent: <Trace />,
  }), [config.scope, config.canvasContent])

  // Read editorValue before calling useWorkbenchCore so the tabGuard closure
  // captures the current value without depending on core's internal state.
  const { value: editorValue } = useEditorState(config.scope)
  const tabGuard = config.tabGuard
    ? (tab: TabId) => config.tabGuard!(tab, { machine, editorValue })
    : undefined

  const core = useWorkbenchCore<M>({
    scope: config.scope,
    enabledTabs,
    tabDefs: tabs,
    machine,
    recipesMap: config.recipesMap,
    machineType: config.scope,
    showAlert,
    dotFromMachine: (m, theme) => toDot(m, config.dotConfig, theme),
    activeDot,
    resolvedTheme,
    initialTab,
    initialRecipe,
    onRecipeLoaded: config.onRecipeLoaded,
    tabGuard,
  })

  useUrlSync({
    machineType: config.scope,
    activeTab: core.activeTab,
    selectedRecipeKey: core.selectedRecipeKey,
  })

  const logic: WorkbenchLogic<M> = {
    ...core,
    machine,
    editorErrors,
    tests,
    setTests,
    simulate: (m, input) => config.simulate(m, input).accepted,
    graphvizOnEdgeHover: setHoveredEdgeId,
  }

  return (
    <div className="h-full flex flex-col">
      <WorkbenchShell logic={logic} />
    </div>
  )
}
