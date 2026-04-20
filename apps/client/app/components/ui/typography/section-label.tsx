import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionLabelProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
}

export function SectionLabel({ ref, className, as: Component = 'p', ...props }: SectionLabelProps & { ref?: React.RefObject<HTMLElement | null> }) {
  return (
    <Component
      ref={ref}
      className={cn('text-lg font-bold font-sans lowercase', className)}
      {...props}
    />
  )
}
SectionLabel.displayName = 'SectionLabel'
