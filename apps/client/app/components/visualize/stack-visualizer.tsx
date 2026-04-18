'use client'

import { LabelText, Surface } from '../ui'

interface StackVisualizerProps {
  stack: string[]
}

export function StackVisualizer({ stack }: StackVisualizerProps) {
  return (
    <Surface className="w-full min-w-0 max-w-full rounded-2xl flex flex-col">
      <div className="px-3 py-2 border-b border-panel-border flex items-center justify-between gap-2">
        <LabelText>
          Stack
        </LabelText>
      </div>

      <div className="px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {stack.length === 0
            ? (
                <div className="w-8 h-8 rounded-sm font-mono text-lg flex items-center justify-center text-muted-foreground">
                  ε
                </div>
              )
            : stack.map((symbol, i) => {
                const isTop = i === stack.length - 1
                return (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className={`w-8 h-8 rounded-sm shrink-0 font-mono text-lg flex items-center justify-center ${
                      isTop
                        ? 'text-primary font-bold underline underline-offset-4 decoration-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {symbol}
                  </div>
                )
              })}
        </div>
        <p className="text-[11px] text-muted-foreground font-mono">
          bottom
          {' '}
          →
        </p>
      </div>
    </Surface>
  )
}
