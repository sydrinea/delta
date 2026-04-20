'use client'

import { useCallback } from 'react'
import { useWorkbenchStore } from '@/store/workbench-store'
import { useEditorState } from '@/hooks/use-editor-state'
import { useCompile } from '@/hooks/use-compile'
import { useTestSuite } from '@/hooks/use-test-suite'
import { useAlert } from '../providers'
import { WORKBENCH_CONFIGS } from './workbench-configs'
import type { MachineType } from '@/lib/worker/protocol'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/inputs/select'

interface RecipeDropdownProps {
  scope: MachineType
  className?: string
  size: 'default' | 'sm' | 'lg'
}

export function RecipeDropdown({
  scope,
  className = '',
  size = 'lg',
}: RecipeDropdownProps) {
  const config = WORKBENCH_CONFIGS[scope]
  const recipesMap = config.recipes
  const recipeEntries = Object.entries(recipesMap)
  
  const { selectedRecipeKey, setSelectedRecipeKey, activeTab, setActiveTab } = useWorkbenchStore()
  const { setEditorValue, clearErrors } = useEditorState(scope)
  const compile = useCompile(scope)
  const { setTests } = useTestSuite(scope)
  const { showAlert } = useAlert()

  const applyRecipe = useCallback(
    async (recipeKey: string) => {
      const recipe = recipesMap[recipeKey]
      if (!recipe) return

      setSelectedRecipeKey(recipeKey)

      const testsWithFreshIds = recipe.tests.map(test => ({
        ...test,
        id: crypto.randomUUID(),
      }))

      try {
        const response = await fetch(recipe.path)
        if (!response.ok) throw new Error(`Failed to load recipe at ${recipe.path}`)

        const fetchedCode = await response.text()
        config.onRecipeLoaded?.({ activeTab, setActiveTab })

        setTests(testsWithFreshIds)
        setEditorValue(fetchedCode.replace('//@ts-nocheck', '').trim())
        clearErrors()
        compile(fetchedCode)
      } catch {
        showAlert({
          title: 'Recipe Import Failed',
          message: 'Could not load the example code right now. Please try again later.',
          confirmText: 'OK',
        })
      }
    },
    [activeTab, clearErrors, compile, config, recipesMap, setEditorValue, setTests, showAlert, setActiveTab, setSelectedRecipeKey],
  )

  if (recipeEntries.length === 0) return null

  const selectedRecipeLabel = recipesMap[selectedRecipeKey]?.label ?? 'load example'

  return (
    <div className={`min-w-0 ${className}`}>
      <Select value={selectedRecipeKey} onValueChange={applyRecipe}>
        <SelectTrigger
          size={size}
          className="ml-auto w-auto max-w-full min-w-0 **:data-[slot=select-value]:max-w-full **:data-[slot=select-value]:overflow-hidden **:data-[slot=select-value]:text-ellipsis **:data-[slot=select-value]:whitespace-nowrap"
        >
          <SelectValue placeholder={selectedRecipeLabel} />
        </SelectTrigger>
        <SelectContent align="end" position="popper">
          {recipeEntries.map(([key, recipe]) => (
            <SelectItem key={key} value={key}>
              {recipe.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
