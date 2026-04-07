'use client'

import type {
  EnabledTabs,
  TabId,
  VisibleTab,
  WorkbenchCoreLogicBase,
} from './types'
import type { Theme } from '@/lib/theme'
import type { MachineType } from '@/lib/worker/protocol'
import type { AutomataScope } from '@/store/automataStore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCompile } from '@/hooks/useCompile'
import { useEditorState } from '@/hooks/useEditorState'
import { useMachineShare } from '@/hooks/useMachineShare'
import { useTestSuite } from '@/hooks/useTestSuite'
import { themeNames } from '@/lib/theme'
import { useAutomataStore } from '@/store/automataStore'
import { getInitialTab, isTabEnabled } from './utils'

interface Recipe {
  label: string
  path: string
  tests: import('@delta/examples').TestCase[]
}

interface AlertPayload {
  title: string
  message: string
  confirmText?: string
}

interface UseWorkbenchVariantCoreOptions<M extends { name?: string }> {
  scope: AutomataScope
  enabledTabs: EnabledTabs
  tabs: VisibleTab[]
  machine: M | null
  recipesMap: Record<string, Recipe>
  machineType: MachineType
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
  scope,
  enabledTabs,
  tabs,
  machine,
  recipesMap,
  machineType,
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

  const compile = useCompile(scope)
  const { value: editorValue, setEditorValue, clearErrors } = useEditorState(scope)
  const { setTests } = useTestSuite(scope)

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

        setTests(testsWithFreshIds)
        setEditorValue(fetchedCode.replace('//@ts-nocheck', '').trim())
        clearErrors()
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
    [activeTabForUI, clearErrors, compile, onRecipeLoaded, recipesMap, setEditorValue, setTests, showAlert],
  )

  const hasAppliedInitialRecipeRef = useRef(false)
  useEffect(() => {
    if (initialRecipe && !hasAppliedInitialRecipeRef.current) {
      hasAppliedInitialRecipeRef.current = true
      applyRecipe(initialRecipe)
    }
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  // Compile once the store is hydrated so machine is populated regardless of active tab or entry path.
  // If hydration has already completed (fast path), compile immediately.
  // Otherwise wait for onFinishHydration so we use the real persisted value, not defaults.
  useEffect(() => {
    if (useAutomataStore.persist.hasHydrated()) {
      compile(useAutomataStore.getState().automata[scope].editorValue)
      return
    }

    const unsub = useAutomataStore.persist.onFinishHydration(() => {
      compile(useAutomataStore.getState().automata[scope].editorValue)
      unsub()
    })

    return unsub
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
      setEditorValue(code)
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
    compile,
    editorValue,
    setActiveTab,
  }
}
