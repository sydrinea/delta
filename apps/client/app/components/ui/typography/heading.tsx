import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/app/lib/utils'

const headingVariants = cva(
  'font-serif text-foreground font-bold',
  {
    variants: {
      variant: {
        h1: 'text-4xl md:text-5xl leading-tight',
        h2: 'text-4xl leading-tight tracking-tight mb-6',
        h3: 'text-[clamp(1.1rem,2.5vw,1.25rem)] mb-3',
        h4: 'text-xl md:text-2xl leading-snug',
        label: 'text-lg font-bold font-sans lowercase tracking-normal',
      },
    },
    defaultVariants: {
      variant: 'h1',
    },
  },
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
  VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function Heading({ ref, className, variant, as, ...props }: HeadingProps & { ref?: React.RefObject<HTMLHeadingElement | null> }) {
  const Comp = as || (variant && variant !== 'label' ? (variant as 'h1' | 'h2' | 'h3' | 'h4') : 'h2')
  return (
    <Comp
      ref={ref}
      className={cn(headingVariants({ variant, className }))}
      {...props}
    />
  )
}
Heading.displayName = 'Heading'
