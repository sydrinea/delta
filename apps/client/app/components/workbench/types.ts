import type { TestCase } from '@delta/examples'
import type { ReactNode } from 'react'

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
