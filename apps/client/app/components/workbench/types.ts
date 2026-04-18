import type { TestCase } from '@delta/examples'
import type { ReactNode } from 'react'
import type { ExecutionError } from '@/lib/worker/protocol'

/** Minimal constraint for machines used in workbench components. */
export interface WorkbenchMachine {
  name?: string
}

export interface Recipe {
  label: string
  path: string
  tests: TestCase[]
}

export type TabId = 'code' | 'canvas' | 'debug' | 'tests'

export interface EnabledTabs {
  code?: boolean
  canvas?: boolean
  debug?: boolean
}

export interface VisibleTab {
  id: TabId
  content: ReactNode
}

export interface ConfirmModalConfig {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmText: string
  cancelText: string
  confirmVariant?:
    | 'primary'
    | 'outline'
    | 'secondary'
    | 'danger'
    | 'ghost'
    | 'destructive'
    | 'warning'
    | 'success'
    | 'info'
    | 'accent'
    | 'link'
  cancelVariant?:
    | 'primary'
    | 'outline'
    | 'secondary'
    | 'danger'
    | 'ghost'
    | 'destructive'
    | 'warning'
    | 'success'
    | 'info'
    | 'accent'
    | 'link'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Returned by a `tabGuard` to block a tab change and show a confirmation modal.
 * `onConfirm` is an optional side-effect called before the tab change proceeds
 * (e.g. converting NFA code to canvas nodes). The core handles the actual tab
 * change and modal cleanup.
 */
export interface TabGuardResult extends Omit<ConfirmModalConfig, 'isOpen' | 'onConfirm' | 'onCancel'> {
  onConfirm?: () => void
}

export interface WorkbenchCoreLogicBase {
  activeTab: TabId
  requestTabChange: (tab: TabId) => void
  visibleTabs: VisibleTab[]
  activeTabContent: ReactNode
  recipeEntries: [string, { label: string }][]
  selectedRecipeKey: string
  applyRecipe: (key: string) => void
  selectedRecipeLabel: string
  machineDot: string | null
  handleShare: () => void
  copied: boolean
}

/** Fields needed by header/compile/share UI only. */
export interface WorkbenchHeaderLogic<M extends WorkbenchMachine> {
  machine: M | null
  editorErrors: ExecutionError[] | null
  editorValue: string
  compile: (code: string) => void
  handleShare: () => void
  copied: boolean
  recipeEntries: [string, { label: string }][]
  selectedRecipeKey: string
  applyRecipe: (key: string) => void
  selectedRecipeLabel: string
}

/** Fields needed by test suite and simulation panels. */
export interface WorkbenchTestLogic<M extends WorkbenchMachine> {
  machine: M | null
  tests: TestCase[]
  setTests: (tests: TestCase[]) => void
  simulate: (machine: M, input: string) => boolean
  selectedRecipeKey: string
}

export interface WorkbenchLogic<
  M extends WorkbenchMachine,
> extends WorkbenchCoreLogicBase, WorkbenchHeaderLogic<M>, WorkbenchTestLogic<M> {
  graphvizOnEdgeHover?: (edgeId: string | null) => void
  confirmModal: ConfirmModalConfig | null
}
