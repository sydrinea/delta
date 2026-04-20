import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
}

export function LabelText({ ref, className, as: Component = 'span', ...props }: LabelTextProps & { ref?: React.RefObject<HTMLElement | null> }) {
  return (
    <Component
      ref={ref}
      className={cn(
        'text-xs font-bold uppercase tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
LabelText.displayName = 'LabelText'
