import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/app/lib/utils'

const badgeVariants = cva(
  'group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border bg-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        ghost: 'border-transparent text-ctp-text',
        default: 'border-ctp-surface2 text-ctp-text',
        secondary: 'border-ctp-surface2 text-ctp-subtext1',
        destructive: 'border-ctp-red/65 text-ctp-red',
        outline: 'border-ctp-surface2 text-ctp-text',
        success: 'border-ctp-green/65 text-ctp-green',
        warning: 'border-ctp-yellow/65 text-ctp-yellow',
        info: 'border-ctp-lavender/65 text-ctp-lavender',
        accent: 'border-ctp-mauve/65 text-ctp-mauve',
      },
    },
    defaultVariants: {
      variant: 'ghost',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'>
  & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
