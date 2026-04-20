import { cn } from '@/lib/utils'
import { LabelText } from '../typography/label-text'

interface SurfaceHeaderProps {
  title: string
  className?: string
  children?: React.ReactNode
}

export function SurfaceHeader({ title, className, children }: SurfaceHeaderProps) {
  return (
    <div
      className={cn(
        'px-3 py-2 min-h-10.5 border-b border-panel-border flex items-center justify-between gap-2',
        className,
      )}
    >
      <LabelText>{title}</LabelText>
      {children}
    </div>
  )
}
