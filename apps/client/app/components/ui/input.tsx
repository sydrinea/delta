import * as React from 'react'

import { cn } from '@/app/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-muted-foreground/25 bg-panel px-3 py-1.5 text-xs text-muted-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
