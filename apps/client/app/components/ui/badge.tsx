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
        ghost: 'border-transparent text-foreground',
        default: 'border-muted text-foreground',
        secondary: 'border-muted text-muted-foreground',
        destructive: 'border-destructive/65 text-destructive',
        outline: 'border-muted text-foreground',
        success: 'border-success/65 text-success',
        warning: 'border-warning/65 text-warning',
        info: 'border-primary/65 text-primary',
        accent: 'border-primary/65 text-primary',
        pink: 'border-pink-500/65 text-pink-500 bg-pink-500/10',
        teal: 'border-teal-500/65 text-teal-500 bg-teal-500/10',
        lavender: 'border-primary/65 text-primary bg-primary/10',
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
