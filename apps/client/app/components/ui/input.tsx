import * as React from 'react'

import { cn } from '@/app/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-ctp-subtext0/25 bg-ctp-mantle px-3 py-1.5 text-xs text-ctp-subtext0 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-ctp-subtext0 placeholder:text-ctp-overlay0 focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender focus-visible:border-ctp-lavender focus-visible:ring-2 focus-visible:ring-ctp-lavender disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
