'use client'

import type { TestCase } from '@delta/examples'
import type { Recipe, TabId } from './types'
import type { AlertPayload } from '@/components/providers/AlertProvider'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseRecipeLoaderOptions {
  recipesMap: Record<string, Recipe>
  compile: (code: string) => void
  setEditorValue: (value: string) => void
  clearErrors: () => void
  setTests: (tests: TestCase[]) => void
  showAlert: (payload: AlertPayload) => void
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  initialRecipe?: string
  onRecipeLoaded?: (args: { activeTab: TabId, setActiveTab: (tab: TabId) => void }) => void
}

export function useRecipeLoader({
  recipesMap,
  compile,
  setEditorValue,
  clearErrors,
  setTests,
  showAlert,
  activeTab,
  setActiveTab,
  initialRecipe,
  onRecipeLoaded,
}: UseRecipeLoaderOptions) {
  const [selectedRecipeKey, setSelectedRecipeKey] = useState('')

  const recipeEntries = useMemo(() => Object.entries(recipesMap), [recipesMap])

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
        if (!response.ok)
          throw new Error(`Failed to load recipe at ${recipe.path}`)

        const fetchedCode = await response.text()
        onRecipeLoaded?.({ activeTab, setActiveTab })

        setTests(testsWithFreshIds)
        setEditorValue(fetchedCode.replace('//@ts-nocheck', '').trim())
        clearErrors()
        compile(fetchedCode)
      }
      catch {
        showAlert({
          title: 'Recipe Import Failed',
          message: 'Could not load the example code right now. Please try again later.',
          confirmText: 'OK',
        })
      }
    },
    [activeTab, clearErrors, compile, onRecipeLoaded, recipesMap, setEditorValue, setTests, showAlert, setActiveTab],
  )

  const hasAppliedInitialRecipeRef = useRef(false)
  useEffect(() => {
    if (initialRecipe && !hasAppliedInitialRecipeRef.current) {
      hasAppliedInitialRecipeRef.current = true
      applyRecipe(initialRecipe)
    }
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  return {
    selectedRecipeKey,
    recipeEntries,
    selectedRecipeLabel: recipesMap[selectedRecipeKey]?.label ?? 'load example',
    applyRecipe,
  }
}
