'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const RE = /^f\d+$/i

function TooltipContent({ ref, className, sideOffset = 6, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { ref?: React.RefObject<React.ElementRef<typeof TooltipPrimitive.Content> | null> }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-toast overflow-hidden',
          'rounded-md border border-muted-foreground/25 bg-panel',
          'px-2.5 py-1.5 text-xs text-foreground shadow-md',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
TooltipContent.displayName = TooltipPrimitive.Content.displayName

const KEY_SYMBOLS: Record<string, string> = {
  alt: '⌥',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  backspace: '⌫',
  cmd: '⌘',
  command: '⌘',
  control: '⌃',
  ctrl: '⌃',
  del: '⌦',
  delete: '⌦',
  enter: '↩',
  esc: '⎋',
  escape: '⎋',
  option: '⌥',
  return: '↩',
  shift: '⇧',
  space: '␣',
  tab: '⇥',
}

function toKeyLabel(token: string) {
  const trimmed = token.trim()

  if (!trimmed)
    return ''

  const lower = trimmed.toLowerCase()
  const symbol = KEY_SYMBOLS[lower]

  if (symbol)
    return symbol

  if (trimmed.length === 1)
    return trimmed.toUpperCase()

  if (RE.test(trimmed))
    return trimmed.toUpperCase()

  return trimmed
}

function Kbd({
  keys,
  className,
}: {
  keys: string[]
  className?: string
}) {
  const labels = keys.map(toKeyLabel).filter(Boolean)

  if (!labels.length)
    return null

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {labels.map(label => (
        <React.Fragment key={label}>
          <kbd
            className={cn(
              'inline-flex items-center justify-center',
              'rounded border border-muted border-b-2',
              'bg-panel-border px-1.5 py-px',
              'font-mono text-[10px] leading-4 text-muted-foreground',
              'shadow-sm',
            )}
          >
            {label}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  )
}

interface WithTooltipProps {
  label?: string
  shortcut?: string[]
  side?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['side']
  children: React.ReactNode
}

function WithTooltip({
  label,
  shortcut,
  side = 'top',
  children,
}: WithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children as React.ReactElement}
      </TooltipTrigger>
      <TooltipContent side={side}>
        <span className="flex items-center gap-1.5">
          {label}
          {!!shortcut?.length && <Kbd keys={shortcut} />}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

export {
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  WithTooltip,
}
