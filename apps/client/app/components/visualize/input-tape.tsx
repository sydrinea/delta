'use client'

import type { MachineType } from '@/lib/worker/protocol'
import { useSimulatorStore } from '@/store/simulator-store'

function SingleStreamTape() {
  const input = useSimulatorStore(s => s.input)
  const step = useSimulatorStore(s => s.step)
  const trace = useSimulatorStore(s => s.trace)
  const isLast = trace.length > 0 && step === trace.length - 1

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="relative flex-1 basis-0 min-w-0 max-w-full overflow-hidden bg-background p-1 rounded border border-muted h-10">
        <div className="absolute inset-y-1 left-1/2 w-px bg-primary/70 pointer-events-none" />
        <div
          className="relative left-1/2 flex will-change-transform"
          style={{
            transform: `translateX(calc(-${step * 32 + 16}px))`,
          }}
        >
          {Array.from({ length: Math.max(input.length + 5, step + 5) }).map((_, i) => {
            const char = input[i]
            const isActive = !isLast && i === step
            const isPast = isLast || i < step

            const className = isActive
              ? 'text-primary font-bold bg-panel-border ring-1 ring-primary'
              : isPast
                ? 'text-muted'
                : 'text-muted-foreground'

            return (
              <span
                key={i}
                className={`flex items-center justify-center w-8 h-8 font-mono text-lg rounded-sm shrink-0 ${className}`}
              >
                {char || '\u00A0'}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface TMTapeRowProps {
  tape: string[]
  rowIndex: number
  isLast: boolean
}

function TMTapeRow({ tape, rowIndex }: TMTapeRowProps) {
  const headIndex = tape.findIndex(cell => cell.startsWith('[') && cell.endsWith(']'))
  const safeHeadIndex = headIndex >= 0 ? headIndex : Math.floor(tape.length / 2)

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <span className="text-xs text-muted-foreground min-w-8 text-right pr-2">
        T
        {rowIndex + 1}
        :
      </span>
      <div className="relative flex-1 basis-0 min-w-0 max-w-full overflow-hidden bg-background p-1 rounded border border-muted h-10">
        <div className="absolute inset-y-1 left-1/2 w-px bg-primary/70 pointer-events-none" />
        <div
          className="relative left-1/2 flex will-change-transform"
          style={{
            transform: `translateX(calc(-${safeHeadIndex * 32 + 16}px))`,
          }}
        >
          {tape.map((cell, i) => {
            const isHead = i === headIndex
            // eslint-disable-next-line e18e/prefer-static-regex
            const symbol = cell.replace(/^\[/, '').replace(/\]$/, '')
            const className = isHead
              ? 'text-primary font-bold bg-panel-border ring-1 ring-primary'
              : 'text-foreground'

            return (
              <span
                key={i}
                className={`flex items-center justify-center w-8 h-8 font-mono text-lg rounded-sm shrink-0 ${className}`}
              >
                {symbol || '\u00A0'}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface InputTapeProps {
  scope: MachineType
}

export function InputTape({ scope }: InputTapeProps) {
  const trace = useSimulatorStore(s => s.trace)
  const step = useSimulatorStore(s => s.step)
  const isLast = trace.length > 0 && step === trace.length - 1
  const current = trace[step]

  if (!current)
    return null

  if (scope === 'tm') {
    const tapes = current.tapes ?? []
    return (
      <div className="flex flex-col gap-1 text-lg tracking-widest w-full min-w-0 px-4 box-border">
        {tapes.map((tape, i) => (
          <TMTapeRow key={i} tape={tape} rowIndex={i} isLast={isLast} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 text-lg tracking-widest w-full min-w-0 px-4 box-border">
      <SingleStreamTape />
    </div>
  )
}
