import type { ReactNode } from 'react'
import type {
  EnabledTabs,
  TabId,
  VisibleTab,
} from './types'

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
