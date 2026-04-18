'use client'

import type { ConfirmModalConfig, EnabledTabs, TabGuardResult, TabId, VisibleTab } from './types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getInitialTab, isTabEnabled } from './utils'

interface UseTabManagerOptions {
  enabledTabs: EnabledTabs
  tabs: VisibleTab[]
  initialTab?: TabId
  tabGuard?: (tab: TabId) => TabGuardResult | null
}

export function useTabManager({ enabledTabs, tabs, initialTab, tabGuard }: UseTabManagerOptions) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (initialTab && isTabEnabled(enabledTabs, initialTab))
      return initialTab
    return getInitialTab(enabledTabs)
  })
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null)

  // Always holds the latest tabGuard so requestTabChange's useCallback can
  // reference it without needing to be re-created on every render.
  const tabGuardRef = useRef(tabGuard)
  useEffect(() => {
    tabGuardRef.current = tabGuard
  }, [tabGuard])

  const visibleTabs = useMemo(
    () => tabs.filter(tab => isTabEnabled(enabledTabs, tab.id)),
    [enabledTabs, tabs],
  )

  const activeTabForUI = useMemo(() => {
    if (visibleTabs.some(tab => tab.id === activeTab))
      return activeTab
    return visibleTabs[0]?.id ?? activeTab
  }, [activeTab, visibleTabs])

  const activeTabContent = useMemo(
    () =>
      visibleTabs.find(tab => tab.id === activeTabForUI)?.content
      ?? visibleTabs[0]?.content,
    [activeTabForUI, visibleTabs],
  )

  const requestTabChange = useCallback(
    (tab: TabId) => {
      if (!isTabEnabled(enabledTabs, tab))
        return

      const guard = tabGuardRef.current?.(tab)
      if (guard) {
        const { onConfirm: sideEffect, ...modalProps } = guard
        setConfirmModal({
          ...modalProps,
          isOpen: true,
          onConfirm: () => {
            sideEffect?.()
            setActiveTab(tab)
            setConfirmModal(null)
          },
          onCancel: () => setConfirmModal(null),
        })
        return
      }

      setActiveTab(tab)
    },
    [enabledTabs],
  )

  return {
    activeTab: activeTabForUI,
    setActiveTab,
    requestTabChange,
    visibleTabs,
    activeTabContent,
    confirmModal,
  }
}
