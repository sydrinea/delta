'use client'

import type { TraceStep } from '@/store/simulator-store'
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulator-store'
import { ConfigurationTable } from './configuration-table'
import { StackVisualizer } from './stack-visualizer'

function makeStackColumn(selectedIndex: number) {
  return {
    header: 'Stack',
    cell: (traceStep: TraceStep) => {
      const configurations = traceStep.configurations ?? []
      if (configurations.length === 0)
        return <span className="text-muted-foreground font-mono text-xs">—</span>

      const config = configurations[Math.min(selectedIndex, configurations.length - 1)]!
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
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setSelectedIndex(0)
  }, [current])

  const safeIndex = Math.min(selectedIndex, configurations.length - 1)
  const selectedConfig = configurations[safeIndex] ?? null

  // stack[0] is top; reverse for display so rightmost = top
  const displayStack = selectedConfig ? [...selectedConfig.stack].reverse() : []

  return (
    <div className="flex flex-col gap-3">
      <StackVisualizer stack={displayStack} />
      <ConfigurationTable
        extraColumns={[makeStackColumn(safeIndex)]}
      />
    </div>
  )
}
