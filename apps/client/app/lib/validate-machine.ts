import type { z } from 'zod'
import type { ExecutionError } from './run-code'
import type { MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automata-store'
import { NFASchema, PDASchema, TMSchema } from '@delta/build'

const MACHINE_SCHEMAS: Record<MachineType, z.ZodType> = {
  nfa: NFASchema,
  pda: PDASchema,
  tm: TMSchema,
}

export type ValidationResult<M>
  = | { ok: true, machine: M }
    | { ok: false, error: ExecutionError }

export function validateMachine<M extends AnyMachine>(payload: unknown, machineType: MachineType): ValidationResult<M> {
  const parse = MACHINE_SCHEMAS[machineType].safeParse(payload)
  if (!parse.success) {
    return {
      ok: false,
      error: {
        message: `Invalid ${machineType.toUpperCase()} export. Did you forget to call .build()?`,
        line: 0,
        column: 0,
      },
    }
  }
  return { ok: true, machine: parse.data as M }
}
