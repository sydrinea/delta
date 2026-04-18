import { NFAComponent } from './Workbench.nfa'
import { PDAComponent } from './Workbench.pda'
import { TMComponent } from './Workbench.tm'

export const Workbench = {
  NFA: NFAComponent,
  PDA: PDAComponent,
  TM: TMComponent,
}

export { MachineWorkbench } from './MachineWorkbench'
export type { MachineWorkbenchConfig } from './MachineWorkbench'
export { WorkbenchShell } from './WorkbenchShell'
