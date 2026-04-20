import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/app/lib/utils'

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-horizontal:flex-col',
        className,
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  'group/tabs-list relative inline-flex w-fit items-center justify-center overflow-hidden rounded-full border border-muted-foreground/25 bg-panel p-1 text-muted-foreground backdrop-blur-sm group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col',
  {
    variants: {
      variant: {
        default: '',
        line: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function TabsList({
  children,
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>
  & VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  })

  const updateIndicatorFromTrigger = React.useCallback((trigger: HTMLElement) => {
    setIndicatorStyle({
      width: `${trigger.offsetWidth}px`,
      height: `${trigger.offsetHeight}px`,
      transform: `translate3d(${trigger.offsetLeft}px, ${trigger.offsetTop}px, 0)`,
      opacity: 1,
    })
  }, [])

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      ref={listRef}
      className={cn(tabsListVariants({ variant }), className)}
      onPointerOverCapture={(event: React.PointerEvent<HTMLDivElement>) => {
        const target = event.target
        if (!(target instanceof HTMLElement))
          return

        const hoveredTrigger = target.closest('[data-slot="tabs-trigger"]')
        if (!(hoveredTrigger instanceof HTMLElement))
          return

        updateIndicatorFromTrigger(hoveredTrigger)
      }}
      onFocusCapture={(event: React.FocusEvent<HTMLDivElement>) => {
        const target = event.target
        if (!(target instanceof HTMLElement))
          return

        const focusedTrigger = target.closest('[data-slot="tabs-trigger"]')
        if (!(focusedTrigger instanceof HTMLElement))
          return

        updateIndicatorFromTrigger(focusedTrigger)
      }}
      onMouseLeave={() => {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }))
      }}
      onBlurCapture={(event: React.FocusEvent<HTMLDivElement>) => {
        const next = event.relatedTarget
        if (next instanceof Node && event.currentTarget.contains(next))
          return

        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }))
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-muted-foreground/35 transition-[transform,width,height,opacity] duration-300 ease-out"
        style={indicatorStyle}
      />
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative z-raised inline-flex h-full flex-1 cursor-pointer items-center justify-center rounded-full border border-transparent px-2.5 py-1 text-xs font-medium whitespace-nowrap text-foreground/75 transition-colors duration-200 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:py-[calc(--spacing(1.25))] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=active]:border-primary/45 data-[state=active]:bg-primary/14 data-[state=active]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 text-xs/relaxed outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger }
