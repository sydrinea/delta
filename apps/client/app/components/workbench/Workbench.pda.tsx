'use client'

import type { PDA } from '@delta/build'
import type { TraceBottomPanelContext, TraceInputArgs } from '../visualize/TraceContext'
import type { MachineWorkbenchConfig } from './MachineWorkbench'
import type { EnabledTabs, TabId } from './types'
import { recipes } from '@delta/examples/recipes'
import { simulatePDA } from '@delta/simulator'
import { pdaDotConfig } from '@/lib/dot'
import { PDABottomPanel } from '../visualize/PDABottomPanel'
import { MachineWorkbench } from './MachineWorkbench'
import { buildSingleStreamInputTokens } from './utils'

function getPdaInputTokens(args: TraceInputArgs) {
  return buildSingleStreamInputTokens(args, 'pda')
}

const pdaConfig: MachineWorkbenchConfig<PDA> = {
  scope: 'pda',
  defaultTabs: { code: true, canvas: false, debug: true },
  recipesMap: recipes.pda,
  simulate: (machine, input) => {
    const result = simulatePDA(machine, input, {
      maxSteps: Math.max(1000, input.length * 100),
    })
    return {
      accepted: result.accepted,
      exceededStepLimit: result.exceededStepLimit,
      trace: result.trace.map(s => ({ states: s.states, configurations: s.configurations })),
    }
  },
  dotConfig: pdaDotConfig,
  getInputTokens: getPdaInputTokens,
  bottomPanel: (ctx: TraceBottomPanelContext<PDA>) => (
    <PDABottomPanel
      current={ctx.current}
      trace={ctx.trace}
      step={ctx.step}
      input={ctx.input}
      isLast={ctx.isLast}
      accepted={ctx.accepted}
    />
  ),
}

interface WorkbenchPDAProps {
  enabledTabs?: EnabledTabs
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

export function PDAComponent({
  enabledTabs,
  initialTab,
  initialRecipe,
  initialInput,
}: WorkbenchPDAProps) {
  return (
    <MachineWorkbench
      config={pdaConfig}
      enabledTabs={enabledTabs}
      initialTab={initialTab}
      initialRecipe={initialRecipe}
      initialInput={initialInput}
    />
  )
}
