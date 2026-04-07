'use client'

import type { NFA } from '@delta/build'
import type { TraceBottomPanelContext, TraceInputArgs } from '../visualize/TraceContext'
import type { EnabledTabs, TabId, WorkbenchLogic } from './types'
import { recipes } from '@delta/examples/recipes'
import { simulate as simulateNFA } from '@delta/simulator'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { useCompiledMachine } from '@/hooks/useCompiledMachine'
import { useEditorState } from '@/hooks/useEditorState'
import { useTestSuite } from '@/hooks/useTestSuite'
import { useUrlSync } from '@/hooks/useUrlSync'
import { containsCustomLogicOrComments } from '@/lib/detect-custom-logic'
import { toDot } from '@/lib/dot'
import { nfaToFlow } from '@/lib/flow/toFlow'
import { themeNames } from '@/lib/theme'
import { useNfaStore } from '@/store/nfaStore'
import { DeltaEditor, FlowEditor } from '../editor'
import { useAlert } from '../providers'
import { ConfigurationTable, Trace, TraceProvider, useTraceSimulationContext } from '../visualize'
import { useWorkbenchVariantCore } from './useWorkbenchVariantCore'
import {
  buildSlidingWindowTokens,
  buildTabs,
  TRACE_WINDOW_SIZE,
} from './utils'
import { WorkbenchShell } from './WorkbenchShell'

interface WorkbenchNFAProps {
  enabledTabs?: EnabledTabs
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

const DEFAULT_TABS: EnabledTabs = {
  code: true,
  canvas: true,
  debug: true,
}

const TAB_LABELS: Record<TabId, string> = {
  code: 'Editor',
  canvas: 'Canvas',
  debug: 'Debug',
  tests: 'Tests',
}

function useNfaWorkbenchLogic(
  enabledTabs: EnabledTabs,
  resolvedTheme: string | undefined,
  initialTab?: TabId,
  initialRecipe?: string,
): WorkbenchLogic<NFA> {
  const [showWarning, setShowWarning] = useState(false)
  const [pendingTab, setPendingTab] = useState<TabId | null>(null)

  const machine = useCompiledMachine<NFA>('nfa')
  const { value: editorValue, errors: editorErrors } = useEditorState('nfa')
  const { tests, setTests } = useTestSuite('nfa')
  const patchNfaGraph = useNfaStore(s => s.patch)
  const { showAlert } = useAlert()

  const { dot: activeDot } = useTraceSimulationContext<NFA>()

  const tabs = useMemo(
    () =>
      buildTabs({
        codeContent: <DeltaEditor scope="nfa" />,
        canvasContent: (
          <ReactFlowProvider>
            <FlowEditor />
          </ReactFlowProvider>
        ),
        debugContent: <Trace />,
      }),
    [],
  )

  const core = useWorkbenchVariantCore<NFA>({
    scope: 'nfa',
    enabledTabs,
    tabs,
    machine,
    recipesMap: recipes.nfa,
    machineType: 'nfa',
    showAlert,
    dotFromMachine: toDot,
    activeDot,
    resolvedTheme,
    initialTab,
    initialRecipe,
    onRecipeLoaded: ({ activeTab, setActiveTab }) => {
      if (activeTab === 'canvas') {
        setActiveTab('code')
      }
    },
  })

  const requestTabChange = (tab: TabId) => {
    if (tab === 'canvas' && core.base.activeTab !== 'canvas') {
      if (containsCustomLogicOrComments(editorValue)) {
        setPendingTab(tab)
        setShowWarning(true)
        return
      }
    }

    core.base.requestTabChange(tab)
  }

  const confirmTabChange = () => {
    if (pendingTab === 'canvas' && machine) {
      const { nodes, edges } = nfaToFlow(machine)
      patchNfaGraph({ nodes, edges, startId: machine.startState })
    }

    if (pendingTab) {
      core.base.requestTabChange(pendingTab)
    }

    setShowWarning(false)
    setPendingTab(null)
  }

  const cancelTabChange = () => {
    setShowWarning(false)
    setPendingTab(null)
  }

  return {
    ...core.base,
    requestTabChange,
    machine,
    editorErrors,
    editorValue,
    compile: core.compile,
    tests,
    setTests,
    simulate: (targetMachine, input) =>
      simulateNFA(targetMachine, input).accepted,
    confirmModal: {
      isOpen: showWarning,
      title: 'Switching to Canvas',
      message:
        'Entering the canvas will automatically convert your code. Any custom formatting or comments will be lost. Do you want to continue?',
      confirmText: 'Convert to Canvas',
      cancelText: `Stay in ${TAB_LABELS[core.base.activeTab]}`,
      confirmVariant: 'destructive',
      cancelVariant: 'secondary',
      onConfirm: confirmTabChange,
      onCancel: cancelTabChange,
    },
  }
}

function getNfaInputTokens(args: TraceInputArgs) {
  return buildSlidingWindowTokens({
    centerIndex: args.step,
    windowSize: TRACE_WINDOW_SIZE,
    makeKey: (charIndex, slotIndex) => `nfa-${slotIndex}-${charIndex}`,
    resolveToken: (charIndex, slotIndex) => {
      if (charIndex < 0 || charIndex >= args.input.length) {
        return null
      }

      const isActive
        = !args.isLast && slotIndex === Math.floor(TRACE_WINDOW_SIZE / 2)
      const isPast = args.isLast || charIndex < args.step

      return {
        text: args.input[charIndex],
        isActive,
        className: isActive
          ? 'text-ctp-lavender font-bold bg-ctp-surface0 ring-1 ring-ctp-lavender'
          : isPast
            ? 'text-ctp-surface2'
            : 'text-ctp-subtext1',
      }
    },
  })
}

export function NFAComponent({
  enabledTabs = DEFAULT_TABS,
  initialTab,
  initialRecipe,
  initialInput,
}: WorkbenchNFAProps) {
  const machine = useCompiledMachine<NFA>('nfa')
  const { tests } = useTestSuite('nfa')
  const { resolvedTheme } = useTheme()
  const theme = themeNames[resolvedTheme ?? 'light']

  return (
    <TraceProvider<NFA>
      machine={machine}
      tests={tests}
      simulate={(currentMachine, input) => simulateNFA(currentMachine, input)}
      getDot={(currentMachine, states) => toDot(currentMachine, theme, states)}
      getInputTokens={getNfaInputTokens}
      initialInput={initialInput}
      bottomPanel={({
        trace,
        step,
        input,
        isLast,
        accepted,
      }: TraceBottomPanelContext<NFA>) => (
        <ConfigurationTable
          trace={trace}
          step={step}
          input={input}
          isLast={isLast}
          accepted={accepted}
        />
      )}
    >
      <NFAWorkbenchWithTraceContext
        enabledTabs={enabledTabs}
        resolvedTheme={resolvedTheme}
        initialTab={initialTab}
        initialRecipe={initialRecipe}
      />
    </TraceProvider>
  )
}

function NFAWorkbenchWithTraceContext({
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
  const logic = useNfaWorkbenchLogic(enabledTabs, resolvedTheme, initialTab, initialRecipe)
  useUrlSync({ machineType: 'nfa', activeTab: logic.activeTab, selectedRecipeKey: logic.selectedRecipeKey })
  return (
    <div className="h-full flex flex-col">
      <WorkbenchShell logic={logic} />
    </div>
  )
}
