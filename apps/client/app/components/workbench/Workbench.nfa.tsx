'use client'

import type { NFA } from '@delta/build'
import type { TraceBottomPanelContext, TraceInputArgs } from '../visualize/TraceContext'
import type { MachineWorkbenchConfig } from './MachineWorkbench'
import type { EnabledTabs, TabId } from './types'
import { recipes } from '@delta/examples/recipes'
import { simulate as simulateNFA } from '@delta/simulator'
import { ReactFlowProvider } from 'reactflow'
import { containsCustomLogicOrComments } from '@/lib/detect-custom-logic'
import { nfaDotConfig } from '@/lib/dot'
import { nfaToFlow } from '@/lib/flow/toFlow'
import { useNfaStore } from '@/store/nfaStore'
import { FlowEditor } from '../editor'
import { ConfigurationTable } from '../visualize'
import { MachineWorkbench } from './MachineWorkbench'
import { buildSingleStreamInputTokens } from './utils'

function getNfaInputTokens(args: TraceInputArgs) {
  return buildSingleStreamInputTokens(args, 'nfa')
}

const nfaConfig: MachineWorkbenchConfig<NFA> = {
  scope: 'nfa',
  defaultTabs: { code: true, canvas: true, debug: true },
  recipesMap: recipes.nfa,
  canvasContent: (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  ),
  simulate: (machine, input) => {
    const result = simulateNFA(machine, input)
    return {
      accepted: result.accepted,
      trace: result.trace.map(s => ({ states: s.states })),
    }
  },
  dotConfig: nfaDotConfig,
  getInputTokens: getNfaInputTokens,
  bottomPanel: ({ trace, step, input, isLast, accepted }: TraceBottomPanelContext<NFA>) => (
    <ConfigurationTable
      trace={trace}
      step={step}
      input={input}
      isLast={isLast}
      accepted={accepted}
    />
  ),
  tabGuard: (tab, { machine, editorValue }) => {
    if (tab !== 'canvas' || !containsCustomLogicOrComments(editorValue))
      return null

    return {
      title: 'Switching to Canvas',
      message: (
        <>
          Entering the canvas will automatically
          {' '}
          <a className="underline text-ctp-blue" href="/guide/nfa#canvas">convert your code</a>
          . Any helper methods, custom formatting, or comments will be lost.
        </>
      ),
      confirmText: 'Convert to Canvas',
      cancelText: 'Stay in Editor',
      confirmVariant: 'destructive',
      cancelVariant: 'secondary',
      onConfirm: () => {
        if (machine) {
          const { nodes, edges } = nfaToFlow(machine)
          useNfaStore.getState().patch({ nodes, edges, startId: machine.startState })
        }
      },
    }
  },
  onRecipeLoaded: ({ activeTab, setActiveTab }) => {
    if (activeTab === 'canvas')
      setActiveTab('code')
  },
}

interface WorkbenchNFAProps {
  enabledTabs?: EnabledTabs
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

export function NFAComponent({
  enabledTabs,
  initialTab,
  initialRecipe,
  initialInput,
}: WorkbenchNFAProps) {
  return (
    <MachineWorkbench
      config={nfaConfig}
      enabledTabs={enabledTabs}
      initialTab={initialTab}
      initialRecipe={initialRecipe}
      initialInput={initialInput}
    />
  )
}
