import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'destructive'
  className?: string
  children: React.ReactNode
}

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-xs font-bold',
        status === 'success' ? 'text-success' : 'text-destructive',
        className,
      )}
    >
      {children}
    </span>
  )
}
