import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/app/lib/utils'

const buttonVariants = cva(
  'group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  {
    variants: {
      variant: {
        primary:
          'border-muted-foreground/25 bg-panel-border/85 hover:bg-muted/70 aria-expanded:bg-muted/70 focus-visible:border-muted focus-visible:ring-muted/30',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'border-muted-foreground/25 bg-panel-border/45 hover:bg-panel-border/60 aria-expanded:bg-panel-border/60 focus-visible:border-muted-foreground/25 focus-visible:ring-muted/25',
        danger:
          'border-warning/70 bg-warning/12 text-warning hover:bg-warning/18 aria-expanded:bg-warning/18 focus-visible:border-warning/80 focus-visible:ring-warning/25',
        ghost:
          'border-muted-foreground/25 bg-panel-border/45 text-muted-foreground hover:bg-muted/55 hover:text-foreground aria-expanded:bg-muted/55 aria-expanded:text-foreground',
        destructive:
          'border-destructive/70 bg-destructive/12 text-destructive hover:bg-destructive/18 aria-expanded:bg-destructive/18 focus-visible:border-destructive/80 focus-visible:ring-destructive/25',
        warning:
          'border-warning/70 bg-warning/12 text-warning hover:bg-warning/18 aria-expanded:bg-warning/18 focus-visible:border-warning/80 focus-visible:ring-warning/25',
        success:
          'border-success/70 bg-success/12 text-success hover:bg-success/18 aria-expanded:bg-success/18 focus-visible:border-success/80 focus-visible:ring-success/25',
        info:
          'border-primary/70 bg-primary/12 text-primary hover:bg-primary/18 aria-expanded:bg-primary/18 focus-visible:border-primary/80 focus-visible:ring-primary/25',
        accent:
          'border-primary/70 bg-primary/12 text-primary hover:bg-primary/18 aria-expanded:bg-primary/18 focus-visible:border-primary/80 focus-visible:ring-primary/25',
        mauve:
          'border-primary/70 bg-primary/12 text-primary hover:bg-primary/18 aria-expanded:bg-primary/18 focus-visible:border-primary/80 focus-visible:ring-primary/25',
        embossed:
          'rounded-lg text-muted-foreground hover:text-foreground hover:bg-panel-border border border-transparent hover:border-muted transition-all duration-200',
        link: 'text-primary hover:text-primary/85 underline-offset-4 hover:underline',
      },
      size: {
        'default':
          'h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        'xs': 'h-6 gap-1 rounded-lg px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=\'size-\'])]:size-3',
        'sm': 'h-8 gap-1 rounded-lg px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*=\'size-\'])]:size-3.5',
        'lg': 'h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        'icon': 'size-8',
        'icon-xs': 'size-6 rounded-lg [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-sm': 'size-7 rounded-lg',
        'icon-touch': 'size-7 rounded-lg [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'primary',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'>
  & VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
