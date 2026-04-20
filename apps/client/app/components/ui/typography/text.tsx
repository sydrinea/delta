import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/app/lib/utils'

const textVariants = cva(
  'text-foreground',
  {
    variants: {
      variant: {
        default: 'text-base',
        lead: 'text-sm md:text-md leading-relaxed max-w-md',
        body: 'text-sm leading-relaxed',
        muted: 'text-sm text-muted-foreground font-sans',
        code: 'font-mono text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
  VariantProps<typeof textVariants> {
  as?: React.ElementType
}

export function Text({ ref, className, variant, as: Comp = 'p', ...props }: TextProps & { ref?: React.RefObject<HTMLParagraphElement | null> }) {
  return (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant, className }))}
      {...props}
    />
  )
}
Text.displayName = 'Text'
