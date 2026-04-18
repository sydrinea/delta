import type { ReactNode } from 'react'
import type { NFA, PDA, TuringMachine } from '@delta/build'
import type { TabId, TabGuardResult, Recipe } from './types'
import { recipes } from '@delta/examples/recipes'
import { ReactFlowProvider } from 'reactflow'
import { containsCustomLogicOrComments } from '@/lib/detect-custom-logic'
import { nfaDotConfig, pdaDotConfig, tmDotConfig } from '@/lib/dot'
import { nfaToFlow } from '@/lib/flow/to-flow'
import { useNfaStore } from '@/store/nfa-store'
import { FlowEditor } from '../editor'
import { ConfigurationTable, TransitionTable } from '../visualize'
import { PDABottomPanel } from '../visualize/pda-bottom-panel'
import type { MachineType } from '@/lib/worker/protocol'
import type { DotConfig, DotMachineBase } from '@/lib/dot'
import { simulate as simulateNFA, simulatePDA, simulateTM } from '@delta/simulator'

export interface WorkbenchMachineConfig<M extends DotMachineBase> {
  scope: MachineType
  hasCanvas: boolean
  recipes: Record<string, Recipe>
  dotConfig: DotConfig<M>
  bottomPanel: () => ReactNode
  canvasContent?: ReactNode
  tabGuard?: (tab: TabId, ctx: { machine: M | null; editorValue: string }) => TabGuardResult | null
  onRecipeLoaded?: (args: { activeTab: TabId; setActiveTab: (tab: TabId) => void }) => void
  simulate: (machine: M, input: string) => { accepted: boolean }
}

export const WORKBENCH_CONFIGS: {
  nfa: WorkbenchMachineConfig<NFA>
  pda: WorkbenchMachineConfig<PDA>
  tm: WorkbenchMachineConfig<TuringMachine>
} = {
  nfa: {
    scope: 'nfa',
    hasCanvas: true,
    recipes: recipes.nfa,
    dotConfig: nfaDotConfig,
    simulate: (m, input) => simulateNFA(m, input),
    bottomPanel: () => <ConfigurationTable />,
    canvasContent: (
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    ),
    tabGuard: (tab, { machine, editorValue }) => {
      if (tab !== 'canvas' || !containsCustomLogicOrComments(editorValue))
        return null

      return {
        title: 'Switching to Canvas',
        message: (
          <>
            Entering the canvas will automatically{' '}
            <a className="underline text-primary" href="/guide/nfa#canvas">convert your code</a>
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
  },
  pda: {
    scope: 'pda',
    hasCanvas: false,
    recipes: recipes.pda,
    dotConfig: pdaDotConfig,
    simulate: (m, input) => simulatePDA(m, input, { maxSteps: Math.max(1000, input.length * 100) }),
    bottomPanel: () => <PDABottomPanel />,
  },
  tm: {
    scope: 'tm',
    hasCanvas: false,
    recipes: recipes.tm,
    dotConfig: tmDotConfig,
    simulate: (m, input) => simulateTM(m, input, { maxSteps: Math.max(1000, input.length * 100) }),
    bottomPanel: () => <TransitionTable />,
  },
}

