'use client'

import type { WorkbenchLogic, WorkbenchMachine } from './types'
import { DesktopWorkbench } from './DesktopWorkbench'
import { MobileWorkbench } from './MobileWorkbench'

export { RecipeDropdown } from './RecipeDropdown'

interface WorkbenchShellProps<M extends WorkbenchMachine> {
  logic: WorkbenchLogic<M>
}

export function WorkbenchShell<M extends WorkbenchMachine>({ logic }: WorkbenchShellProps<M>) {
  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
      <DesktopWorkbench logic={logic} />
      <MobileWorkbench logic={logic} />
    </div>
  )
}
