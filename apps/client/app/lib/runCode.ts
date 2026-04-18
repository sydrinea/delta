import type { z } from 'zod'
import type { CompileErrorDetail, CompileSuccessData, MachineType } from '@/lib/worker/protocol'
import type { AnyMachine } from '@/store/automataStore'
import {
  NFASchema,
  PDASchema,
  TMSchema,
} from '@delta/build'
import {
  createWorkerRequestId,
  sendWorkerRequest,
  WorkerTimeoutError,
} from '@/lib/worker/client'
import {

  WorkerErrorCodes,
  WorkerMethods,
} from '@/lib/worker/protocol'

export interface ExecutionError {
  message: string
  line: number
  column: number
}

function validateMachine<M extends AnyMachine>(payload: unknown, schema: z.ZodType, machineType: MachineType, onError: (errors: ExecutionError[] | null) => void, onValidMachine: (machine: M) => void): boolean {
  const parse = schema.safeParse(payload)
  if (!parse.success) {
    onError([
      {
        message: `Invalid ${machineType.toUpperCase()} export. Did you forget to call .build()?`,
        line: 0,
        column: 0,
      },
    ])
    return false
  }

  onError(null)
  onValidMachine(parse.data as M)
  return true
}

export async function runCode<M extends AnyMachine>(value: string, machineType: MachineType, onValidMachine: (machine: M) => void, onError: (errors: ExecutionError[] | null) => void) {
  const worker = new Worker(new URL('./worker/index.ts', import.meta.url), {
    type: 'module',
  })

  try {
    const response = await sendWorkerRequest<
      CompileSuccessData,
      CompileErrorDetail
    >(
      worker,
      {
        id: createWorkerRequestId(),
        method: WorkerMethods.Compile,
        params: {
          code: value,
          machineType,
        },
      },
      5000,
    )

    if (response.status === 'error') {
      const compilationErrors = response.error.details?.errors
      if (Array.isArray(compilationErrors) && compilationErrors.length > 0) {
        onError(
          compilationErrors.map((error: ExecutionError) => ({
            message: error.message.split('\n').join('; '),
            line: error.line,
            column: error.column,
          })),
        )
        return
      }

      if (response.error.code === WorkerErrorCodes.Timeout) {
        onError([
          {
            message: 'Execution timed out (Possible infinite loop)',
            line: 0,
            column: 0,
          },
        ])
        return
      }

      onError([
        {
          message: response.error.message,
          line: 0,
          column: 0,
        },
      ])
      return
    }

    const payload = response.data.machine
    const schema: Record<MachineType, z.ZodType> = { nfa: NFASchema, pda: PDASchema, tm: TMSchema }
    validateMachine(
      payload,
      schema[machineType],
      machineType,
      onError,
      onValidMachine,
    )
  }
  catch (err) {
    if (err instanceof WorkerTimeoutError) {
      onError([
        {
          message: 'Execution timed out (Possible infinite loop)',
          line: 0,
          column: 0,
        },
      ])
      return
    }

    onError([
      {
        message: `Worker error: ${err instanceof Error ? err.message : String(err)}`,
        line: 1,
        column: 1,
      },
    ])
  }
  finally {
    worker.terminate()
  }
}
