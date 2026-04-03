'use client'

import type { NFA } from '@delta/build'
import type { TraceBottomPanelContext, TraceInputArgs } from '../visualize/TraceContext'
import type { EnabledTabs, TabId, WorkbenchLogic } from './types'
import { recipes } from '@delta/examples/recipes'
import { simulate as simulateNFA } from '@delta/simulator'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { useCompile } from '@/hooks/useCompile'
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
  makeStoreAdapters,
  TRACE_WINDOW_SIZE,
} from './utils'
import { WorkbenchShell } from './WorkbenchShell'

interface WorkbenchNFAProps {
  enabledTabs?: EnabledTabs
}

const DEFAULT_TABS: EnabledTabs = {
  editor: true,
  canvas: true,
  visualizer: true,
}

const LEADING_LOWERCASE_REGEX = /^[a-z]/

function useNfaWorkbenchLogic(
  enabledTabs: EnabledTabs,
  resolvedTheme: string | undefined,
): WorkbenchLogic<NFA> {
  const [showWarning, setShowWarning] = useState(false)
  const [pendingTab, setPendingTab] = useState<TabId | null>(null)

  const machine = useNfaStore(s => s.machine)
  const editorValue = useNfaStore(s => s.editorValue)
  const tests = useNfaStore(s => s.tests)
  const editorErrors = useNfaStore(s => s.editorErrors)
  const patchNfa = useNfaStore(s => s.patch)
  const { showAlert } = useAlert()

  const compile = useCompile('nfa')
  const { dot: activeDot } = useTraceSimulationContext<NFA>()
  const adapters = useMemo(() => makeStoreAdapters(patchNfa), [patchNfa])

  const tabs = useMemo(
    () =>
      buildTabs({
        editorContent: <DeltaEditor scope="nfa" />,
        canvasContent: (
          <ReactFlowProvider>
            <FlowEditor />
          </ReactFlowProvider>
        ),
        visualizerContent: <Trace />,
      }),
    [],
  )

  const core = useWorkbenchVariantCore<NFA>({
    enabledTabs,
    tabs,
    machine,
    recipesMap: recipes.nfa,
    machineType: 'nfa',
    editorValue,
    adapters,
    compile,
    showAlert,
    dotFromMachine: toDot,
    activeDot,
    resolvedTheme,
    onRecipeLoaded: ({ activeTab, setActiveTab }) => {
      if (activeTab === 'canvas') {
        setActiveTab('editor')
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
      patchNfa({ nodes, edges, startId: machine.startState })
    }

    if (pendingTab) {
      adapters.clearEditorErrors()
      core.setActiveTab(pendingTab)
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
    compile,
    tests,
    setTests: adapters.setTests,
    simulate: (targetMachine, input) =>
      simulateNFA(targetMachine, input).accepted,
    confirmModal: {
      isOpen: showWarning,
      title: 'Switching to Canvas',
      message:
        'Entering the canvas will automatically convert your code. Any custom formatting or comments will be lost. Do you want to continue?',
      confirmText: 'Convert to Canvas',
      cancelText: `Stay in ${core.base.activeTab.replace(LEADING_LOWERCASE_REGEX, s => s.toUpperCase())}`,
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
          ? 'text-ctp-mauve font-bold bg-ctp-surface0 ring-1 ring-ctp-mauve'
          : isPast
            ? 'text-ctp-surface2'
            : 'text-ctp-subtext1',
      }
    },
  })
}

export function NFAComponent({
  enabledTabs = DEFAULT_TABS,
}: WorkbenchNFAProps) {
  const machine = useNfaStore(s => s.machine)
  const tests = useNfaStore(s => s.tests)
  const { resolvedTheme } = useTheme()
  const theme = themeNames[resolvedTheme ?? 'light']

  return (
    <TraceProvider<NFA>
      machine={machine}
      tests={tests}
      simulate={(currentMachine, input) => simulateNFA(currentMachine, input)}
      getDot={(currentMachine, states) => toDot(currentMachine, theme, states)}
      getInputTokens={getNfaInputTokens}
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
      <NFAWorkbenchWithTraceContext enabledTabs={enabledTabs} resolvedTheme={resolvedTheme} />
    </TraceProvider>
  )
}

function NFAWorkbenchWithTraceContext({
  enabledTabs,
  resolvedTheme,
}: {
  enabledTabs: EnabledTabs
  resolvedTheme: string | undefined
}) {
  const logic = useNfaWorkbenchLogic(enabledTabs, resolvedTheme)
  return <WorkbenchShell logic={logic} />
}
