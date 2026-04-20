import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'sunken' | 'elevated'
}

export function Surface({ ref, className, variant = 'default', ...props }: SurfaceProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border',
        {
          'bg-panel border-panel-border': variant === 'default',
          'bg-background border-panel-border inset-shadow-sm': variant === 'sunken',
          'bg-panel border-panel-border shadow-lg drop-shadow-md': variant === 'elevated',
        },
        className,
      )}
      {...props}
    />
  )
}
Surface.displayName = 'Surface'
