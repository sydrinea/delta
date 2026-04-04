import type { TestCase } from '@delta/examples'
import type { ReactNode } from 'react'

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
  message: string
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

export interface WorkbenchEditorError {
  message: string
  line: number
  column: number
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

export interface WorkbenchStoreAdapters {
  setEditorValue: (value: string) => void
  setTests: (tests: TestCase[]) => void
  clearEditorErrors: () => void
}

export interface WorkbenchLogic<
  M extends { name?: string },
> extends WorkbenchCoreLogicBase {
  machine: M | null
  editorErrors: WorkbenchEditorError[] | null
  editorValue: string
  compile: (code: string) => void
  tests: TestCase[]
  setTests: (tests: TestCase[]) => void
  simulate: (machine: M, input: string) => boolean
  graphvizOnEdgeHover?: (edgeId: string | null) => void
  confirmModal?: ConfirmModalConfig
}
