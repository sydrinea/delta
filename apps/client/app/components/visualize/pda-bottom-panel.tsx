'use client'

import type { TraceStep } from '@/store/simulator-store'
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulator-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
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
      {configurations.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Configuration</span>
          <Select
            value={safeIndex.toString()}
            onValueChange={v => setSelectedIndex(Number(v))}
          >
            <SelectTrigger size="sm" className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {configurations.map((cfg, i) => {
                const preview = cfg.stack.length === 0
                  ? 'ε'
                  : cfg.stack.slice(0, 3).join(' ') + (cfg.stack.length > 3 ? ' …' : '')
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <SelectItem key={i} value={i.toString()} className="font-mono text-xs">
                    {cfg.state}
                    {'  '}
                    <span className="text-muted-foreground">
                      [
                      {preview}
                      ]
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
