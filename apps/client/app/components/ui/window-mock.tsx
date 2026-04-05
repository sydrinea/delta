import { cn } from '@/lib/utils'

interface WindowMockProps {
  title?: string
  className?: string
  children: React.ReactNode
}

export function WindowMock({ title, className, children }: WindowMockProps) {
  return (
    <div className={cn('rounded-lg border border-ctp-surface1 bg-ctp-mantle overflow-hidden shadow-xl', className)}>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-ctp-crust border-b border-ctp-surface0">
        <span className="w-3 h-3 rounded-full bg-ctp-red" />
        <span className="w-3 h-3 rounded-full bg-ctp-yellow" />
        <span className="w-3 h-3 rounded-full bg-ctp-green" />
        {title && (
          <span className="ml-3 text-xs font-mono text-ctp-overlay0">{title}</span>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
