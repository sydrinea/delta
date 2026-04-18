'use client'

import type {
  EnabledTabs,
  Recipe,
  TabGuardResult,
  TabId,
  VisibleTab,
  WorkbenchMachine,
} from './types'
import type { AlertPayload } from '@/components/providers/AlertProvider'
import type { Theme } from '@/lib/theme'
import type { MachineType } from '@/lib/worker/protocol'
import { useEffect } from 'react'
import { useCompile } from '@/hooks/useCompile'
import { useEditorState } from '@/hooks/useEditorState'
import { useMachineShare } from '@/hooks/useMachineShare'
import { useTestSuite } from '@/hooks/useTestSuite'
import { useAutomataStore } from '@/store/automataStore'
import { useMachineDot } from './useMachineDot'
import { useRecipeLoader } from './useRecipeLoader'
import { useTabManager } from './useTabManager'

interface UseWorkbenchCoreOptions<M extends WorkbenchMachine> {
  scope: MachineType
  enabledTabs: EnabledTabs
  tabDefs: VisibleTab[]
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
  /**
   * Called when a tab change is requested. Return a `TabGuardResult` to block
   *  and show a confirmation modal, or `null` to allow immediately.
   */
  tabGuard?: (tab: TabId) => TabGuardResult | null
}

export function useWorkbenchCore<M extends WorkbenchMachine>({
  scope,
  enabledTabs,
  tabDefs,
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
  tabGuard,
}: UseWorkbenchCoreOptions<M>) {
  const compile = useCompile(scope)
  const { value: editorValue, setEditorValue, clearErrors } = useEditorState(scope)
  const { setTests } = useTestSuite(scope)

  const tabs = useTabManager({ enabledTabs, tabs: tabDefs, initialTab, tabGuard })

  const recipes = useRecipeLoader({
    recipesMap,
    compile,
    setEditorValue,
    clearErrors,
    setTests,
    showAlert,
    activeTab: tabs.activeTab,
    setActiveTab: tabs.setActiveTab,
    initialRecipe,
    onRecipeLoaded,
  })

  const { machineDot } = useMachineDot({ activeDot, machine, dotFromMachine, resolvedTheme })

  // Compile once the store is hydrated so machine is populated regardless of
  // active tab or entry path.
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
        message: 'Could not generate a share link right now. Please try again later.',
      })
    },
  })

  return {
    ...tabs,
    ...recipes,
    machineDot,
    copied,
    handleShare,
    compile,
    editorValue,
  }
}
