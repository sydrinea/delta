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
          'border-ctp-subtext0/25 bg-ctp-surface0/85 hover:bg-ctp-surface1/70 aria-expanded:bg-ctp-surface1/70 focus-visible:border-ctp-surface2 focus-visible:ring-ctp-surface2/30',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'border-ctp-subtext0/25 bg-ctp-surface0/45 hover:bg-ctp-surface0/60 aria-expanded:bg-ctp-surface0/60 focus-visible:border-ctp-subtext0/25 focus-visible:ring-ctp-surface1/25',
        danger:
          'border-ctp-yellow/70 bg-ctp-yellow/12 text-ctp-yellow hover:bg-ctp-yellow/18 aria-expanded:bg-ctp-yellow/18 focus-visible:border-ctp-yellow/80 focus-visible:ring-ctp-yellow/25',
        ghost:
          'border-ctp-subtext0/25 bg-ctp-surface0/45 text-ctp-subtext1 hover:bg-ctp-surface1/55 hover:text-ctp-text aria-expanded:bg-ctp-surface1/55 aria-expanded:text-ctp-text',
        destructive:
          'border-ctp-red/70 bg-ctp-red/12 text-ctp-red hover:bg-ctp-red/18 aria-expanded:bg-ctp-red/18 focus-visible:border-ctp-red/80 focus-visible:ring-ctp-red/25',
        warning:
          'border-ctp-peach/70 bg-ctp-peach/12 text-ctp-peach hover:bg-ctp-peach/18 aria-expanded:bg-ctp-peach/18 focus-visible:border-ctp-peach/80 focus-visible:ring-ctp-peach/25',
        success:
          'border-ctp-green/70 bg-ctp-green/12 text-ctp-green hover:bg-ctp-green/18 aria-expanded:bg-ctp-green/18 focus-visible:border-ctp-green/80 focus-visible:ring-ctp-green/25',
        info:
          'border-ctp-blue/70 bg-ctp-blue/12 text-ctp-blue hover:bg-ctp-blue/18 aria-expanded:bg-ctp-blue/18 focus-visible:border-ctp-blue/80 focus-visible:ring-ctp-blue/25',
        accent:
          'border-ctp-mauve/70 bg-ctp-mauve/12 text-ctp-mauve hover:bg-ctp-mauve/18 aria-expanded:bg-ctp-mauve/18 focus-visible:border-ctp-mauve/80 focus-visible:ring-ctp-mauve/25',
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
