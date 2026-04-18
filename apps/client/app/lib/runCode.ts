import type { ExecutionError, MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automataStore'
import { validateMachine } from './validateMachine'
import { compileCode } from './worker/compileCode'

export type { ExecutionError } from '@/lib/worker/protocol'

export async function runCode<M extends AnyMachine>(
  value: string,
  machineType: MachineType,
  onValidMachine: (machine: M) => void,
  onError: (errors: ExecutionError[] | null) => void,
) {
  const compiled = await compileCode(value, machineType)
  if (!compiled.ok) {
    onError(compiled.errors)
    return
  }

  const validated = validateMachine<M>(compiled.machine, machineType)
  if (!validated.ok) {
    onError([validated.error])
    return
  }

  onError(null)
  onValidMachine(validated.machine)
}
