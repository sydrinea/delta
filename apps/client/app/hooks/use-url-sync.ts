import type { TabId } from '@/components/workbench/types'
import type { MachineType } from '@/lib/worker/protocol'
import { useEffect, useRef } from 'react'
import { useSimulatorStore } from '@/store/simulator-store'
import { recipeKeyToSlug } from '@/lib/recipe-slug'

export function useUrlSync({
  machineType,
  activeTab,
  selectedRecipeKey,
}: {
  machineType: MachineType
  activeTab: TabId
  selectedRecipeKey: string
}) {
  const input = useSimulatorStore(s => s.input)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    window.history.replaceState(null, '', buildWorkbenchUrl(machineType, activeTab, selectedRecipeKey, input))
  }, [machineType, activeTab, selectedRecipeKey, input])
}

function buildWorkbenchUrl(
  machineType: MachineType,
  activeTab: TabId,
  selectedRecipeKey: string,
  input: string,
): string {
  const base = `/${machineType}`
  if (activeTab === 'code')
    return base
  if (activeTab === 'canvas')
    return `${base}/canvas`
  // debug tab
  if (!selectedRecipeKey)
    return `${base}/debug`
  const slug = recipeKeyToSlug(machineType, selectedRecipeKey)
  if (!slug)
    return `${base}/debug`
  if (!input)
    return `${base}/debug/${slug}`
  return `${base}/debug/${slug}/${encodeURIComponent(input)}`
}
