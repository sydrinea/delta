'use client'

import type { TestCase } from '@delta/examples'
import type {
  EnabledTabs,
  TabId,
  VisibleTab,
  WorkbenchCoreLogicBase,
  WorkbenchStoreAdapters,
} from './types'
import type { Theme } from '@/lib/theme'
import type { MachineType } from '@/lib/worker/protocol'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMachineShare } from '@/hooks/useMachineShare'
import { themeNames } from '@/lib/theme'
import { getInitialTab, isTabEnabled } from './utils'

interface Recipe {
  label: string
  path: string
  tests: TestCase[]
}

interface AlertPayload {
  title: string
  message: string
  confirmText?: string
}

interface UseWorkbenchVariantCoreOptions<M extends { name?: string }> {
  enabledTabs: EnabledTabs
  tabs: VisibleTab[]
  machine: M | null
  recipesMap: Record<string, Recipe>
  machineType: MachineType
  editorValue: string
  adapters: WorkbenchStoreAdapters
  compile: (code: string) => void
  showAlert: (payload: AlertPayload) => void
  dotFromMachine: (machine: M, themeName: Theme) => string
  activeDot: string | null
  resolvedTheme: string | undefined
  initialTab?: TabId
  initialRecipe?: string
  onRecipeLoaded?: (args: {
    activeTab: TabId
    setActiveTab: (tab: TabId) => void
  }) => void
}

export function useWorkbenchVariantCore<M extends { name?: string }>({
  enabledTabs,
  tabs,
  machine,
  recipesMap,
  machineType,
  editorValue,
  adapters,
  compile,
  showAlert,
  dotFromMachine,
  activeDot,
  resolvedTheme,
  initialTab,
  initialRecipe,
  onRecipeLoaded,
}: UseWorkbenchVariantCoreOptions<M>) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (initialTab && isTabEnabled(enabledTabs, initialTab))
      return initialTab
    return getInitialTab(enabledTabs)
  })
  const [selectedRecipeKey, setSelectedRecipeKey] = useState('')

  const recipeEntries = useMemo(() => Object.entries(recipesMap), [recipesMap])
  const selectedRecipeLabel
    = recipesMap[selectedRecipeKey]?.label ?? 'load example'

  const visibleTabs = useMemo(
    () => tabs.filter(tab => isTabEnabled(enabledTabs, tab.id)),
    [enabledTabs, tabs],
  )
  const activeTabForUI = useMemo(() => {
    if (visibleTabs.some(tab => tab.id === activeTab)) {
      return activeTab
    }

    return visibleTabs[0]?.id ?? activeTab
  }, [activeTab, visibleTabs])

  const activeTabContent = useMemo(
    () =>
      visibleTabs.find(tab => tab.id === activeTabForUI)?.content
      ?? visibleTabs[0]?.content,
    [activeTabForUI, visibleTabs],
  )

  const applyRecipe = useCallback(
    async (recipeKey: string) => {
      const recipe = recipesMap[recipeKey]
      if (!recipe)
        return

      setSelectedRecipeKey(recipeKey)

      const testsWithFreshIds = recipe.tests.map(test => ({
        ...test,
        id: crypto.randomUUID(),
      }))

      try {
        const response = await fetch(recipe.path)
        if (!response.ok) {
          throw new Error(`Failed to load recipe at ${recipe.path}`)
        }

        const fetchedCode = await response.text()
        onRecipeLoaded?.({ activeTab: activeTabForUI, setActiveTab })

        adapters.setTests(testsWithFreshIds)
        adapters.setEditorValue(
          fetchedCode.replace('//@ts-nocheck', '').trim(),
        )
        adapters.clearEditorErrors()
        compile(fetchedCode)
      }
      catch {
        showAlert({
          title: 'Recipe Import Failed',
          message:
            'Could not load the example code right now. Please try again later.',
          confirmText: 'OK',
        })
      }
    },
    [activeTabForUI, adapters, compile, onRecipeLoaded, recipesMap, showAlert],
  )

  const hasAppliedInitialRecipeRef = useRef(false)
  useEffect(() => {
    if (initialRecipe && !hasAppliedInitialRecipeRef.current) {
      hasAppliedInitialRecipeRef.current = true
      applyRecipe(initialRecipe)
    }
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  // Compile on mount so machine is populated even when the code tab isn't active.
  // If initialRecipe is also loading, applyRecipe's compile call will win (same worker pattern).
  useEffect(() => {
    compile(editorValue)
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  const requestTabChange = useCallback(
    (tab: TabId) => {
      if (!isTabEnabled(enabledTabs, tab))
        return
      setActiveTab(tab)
    },
    [enabledTabs],
  )

  const machineDot = useMemo(() => {
    if (activeDot)
      return activeDot
    if (!machine)
      return null

    return dotFromMachine(machine, themeNames[resolvedTheme ?? 'light'])
  }, [activeDot, dotFromMachine, machine, resolvedTheme])

  const { copied, handleShare } = useMachineShare({
    machineType,
    code: editorValue,
    canShare: machine !== null,
    onLoadCode: (code) => {
      adapters.setEditorValue(code)
      compile(code)
    },
    onShareError: () => {
      showAlert({
        title: 'Share Failed',
        message:
          'Could not generate a share link right now. Please try again later.',
      })
    },
  })

  const base: WorkbenchCoreLogicBase = {
    activeTab: activeTabForUI,
    requestTabChange,
    visibleTabs,
    activeTabContent,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
    machineDot,
    copied,
    handleShare,
  }

  return {
    base,
    setActiveTab,
  }
}
