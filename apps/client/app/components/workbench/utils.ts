import type { ReactNode } from 'react'
import type {
  EnabledTabs,
  TabId,
  VisibleTab,
} from './types'
import type { TraceInputToken } from '@/components/visualize/TraceContext'

export const TAB_ORDER: TabId[] = ['code', 'canvas', 'debug']
export const TRACE_WINDOW_SIZE = 81

export function isTabEnabled(enabledTabs: EnabledTabs, tab: TabId): boolean {
  // @ts-expect-error -- this is guaranteed to be valid
  return enabledTabs[tab] !== false
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
