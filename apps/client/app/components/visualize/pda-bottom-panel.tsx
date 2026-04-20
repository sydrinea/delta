'use client'

import type { TraceStep } from '@/store/simulator-store'
import { useSimulatorStore } from '@/store/simulator-store'
import { ConfigurationTable } from './configuration-table'
import { StackVisualizer } from './stack-visualizer'

function makeStackColumn() {
  return {
    header: 'Stack',
    cell: (traceStep: TraceStep) => {
      const configurations = traceStep.configurations ?? []
      if (configurations.length === 0)
        return <span className="text-muted-foreground font-mono text-xs">—</span>

      const config = configurations[0]!
      if (config.stack.length === 0)
        return <span className="text-muted-foreground font-mono text-xs">ε</span>

      const truncated = config.stack.length > 6
      const preview = [...config.stack].reverse().slice(truncated ? -6 : undefined).join(' ')

      return (
        <span className="font-mono text-xs text-muted-foreground">
          {preview}
          {truncated && <span className="text-muted-foreground"> …</span>}
        </span>
      )
    },
  }
}

export function PDABottomPanel() {
  const trace = useSimulatorStore(s => s.trace)
  const step = useSimulatorStore(s => s.step)
  const current = trace[step] ?? null
  const configurations = current?.configurations ?? []
  const displayStack = configurations[0] ? [...configurations[0].stack].reverse() : []

  return (
    <div className="flex flex-col gap-3">
      <StackVisualizer stack={displayStack} />
      <ConfigurationTable
        extraColumns={[makeStackColumn()]}
      />
    </div>
  )
}
