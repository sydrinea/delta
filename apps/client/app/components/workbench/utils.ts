import type { ReactNode } from 'react'
import type {
  EnabledTabs,
  TabId,
  VisibleTab,
} from './types'
import type { TraceInputArgs, TraceInputToken } from '@/components/visualize/TraceContext'

export const TAB_ORDER: TabId[] = ['code', 'canvas', 'debug']
export const TRACE_WINDOW_SIZE = 81

export function isTabEnabled(enabledTabs: EnabledTabs, tab: TabId): boolean {
  return (enabledTabs as Record<string, boolean | undefined>)[tab] !== false
}

export function getInitialTab(enabledTabs: EnabledTabs): TabId {
  return TAB_ORDER.find(tab => isTabEnabled(enabledTabs, tab)) ?? 'code'
}

export function buildTabs({
  codeContent,
  canvasContent,
  debugContent,
}: {
  codeContent: ReactNode
  canvasContent: ReactNode
  debugContent: ReactNode
}): VisibleTab[] {
  return TAB_ORDER.map(tab => ({
    id: tab,
    content:
      tab === 'code'
        ? codeContent
        : tab === 'canvas'
          ? canvasContent
          : debugContent,
  }))
}

interface SlidingWindowResolvedToken {
  text: string
  className: string
  isActive?: boolean
  row?: number
}

export function buildSlidingWindowTokens({
  centerIndex,
  makeKey,
  resolveToken,
  windowSize = TRACE_WINDOW_SIZE,
  emptyClassName = 'text-transparent',
  emptyText = '',
}: {
  centerIndex: number
  makeKey: (charIndex: number, slotIndex: number) => string
  resolveToken: (
    charIndex: number,
    slotIndex: number,
  ) => SlidingWindowResolvedToken | null
  windowSize?: number
  emptyClassName?: string
  emptyText?: string
}): TraceInputToken[] {
  const halfWindow = Math.floor(windowSize / 2)
  const tokens: TraceInputToken[] = []

  for (let slotIndex = 0; slotIndex < windowSize; slotIndex++) {
    const charIndex = centerIndex - halfWindow + slotIndex
    const resolved = resolveToken(charIndex, slotIndex)

    if (resolved) {
      tokens.push({
        key: makeKey(charIndex, slotIndex),
        text: resolved.text,
        className: resolved.className,
        isActive: resolved.isActive ?? false,
        row: resolved.row,
      })
      continue
    }

    tokens.push({
      key: makeKey(charIndex, slotIndex),
      text: emptyText,
      className: emptyClassName,
      isActive: false,
    })
  }

  return tokens
}

export function buildSingleStreamInputTokens(
  args: TraceInputArgs,
  keyPrefix: string,
): TraceInputToken[] {
  return buildSlidingWindowTokens({
    centerIndex: args.step,
    windowSize: TRACE_WINDOW_SIZE,
    makeKey: (charIndex, slotIndex) => `${keyPrefix}-${slotIndex}-${charIndex}`,
    resolveToken: (charIndex, slotIndex) => {
      if (charIndex < 0 || charIndex >= args.input.length)
        return null

      const isActive = !args.isLast && slotIndex === Math.floor(TRACE_WINDOW_SIZE / 2)
      const isPast = args.isLast || charIndex < args.step

      return {
        text: args.input[charIndex]!,
        isActive,
        className: isActive
          ? 'text-ctp-lavender font-bold bg-ctp-surface0 ring-1 ring-ctp-lavender'
          : isPast
            ? 'text-ctp-surface2'
            : 'text-ctp-subtext1',
      }
    },
  })
}
