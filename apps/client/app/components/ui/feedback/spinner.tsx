'use client'

import { SpinnerIcon } from '@phosphor-icons/react'
import { cn } from '@/app/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <SpinnerIcon role="status" aria-label="Loading" className={cn('size-4 animate-spin text-panel-border', className)} {...props} />
  )
}

export { Spinner }
