'use client'

interface StackVisualizerProps {
  stack: string[]
}

export function StackVisualizer({ stack }: StackVisualizerProps) {
  return (
    <div className="w-full min-w-0 max-w-full rounded-2xl border border-ctp-surface0 bg-ctp-mantle flex flex-col">
      <div className="px-3 h-10.5 border-b border-ctp-surface0 flex items-center">
        <p className="text-xs uppercase tracking-widest text-ctp-subtext0">
          stack
        </p>
      </div>

      <div className="px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {stack.length === 0
            ? (
                <div className="w-8 h-8 rounded-sm font-mono text-lg flex items-center justify-center text-ctp-subtext0">
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
                        ? 'text-ctp-lavender font-bold underline underline-offset-4 decoration-ctp-lavender'
                        : 'text-ctp-subtext1'
                    }`}
                  >
                    {symbol}
                  </div>
                )
              })}
        </div>
        <p className="text-[11px] text-ctp-subtext0 font-mono">
          bottom
          {' '}
          →
        </p>
      </div>
    </div>
  )
}
