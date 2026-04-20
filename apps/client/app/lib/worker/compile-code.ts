import type { CompileErrorDetail, CompileSuccessData, MachineType } from './protocol'
import type { ExecutionError } from '@/lib/run-code'
import {
  createWorkerRequestId,
  sendWorkerRequest,
  WorkerTimeoutError,
} from './client'
import { WorkerErrorCodes, WorkerMethods } from './protocol'

export type CompileResult
  = | { ok: true, machine: unknown }
    | { ok: false, errors: ExecutionError[] }

export async function compileCode(value: string, machineType: MachineType): Promise<CompileResult> {
  const worker = new Worker(new URL('./index.ts', import.meta.url), { type: 'module' })

  try {
    const response = await sendWorkerRequest<CompileSuccessData, CompileErrorDetail>(
      worker,
      {
        id: createWorkerRequestId(),
        method: WorkerMethods.Compile,
        params: { code: value, machineType },
      },
      5000,
    )

    if (response.status === 'error') {
      const compilationErrors = response.error.details?.errors
      if (Array.isArray(compilationErrors) && compilationErrors.length > 0) {
        return {
          ok: false,
          errors: compilationErrors.map((error: ExecutionError) => ({
            message: error.message.split('\n').join('; '),
            line: error.line,
            column: error.column,
          })),
        }
      }

      if (response.error.code === WorkerErrorCodes.Timeout) {
        return { ok: false, errors: [{ message: 'Execution timed out (Possible infinite loop)', line: 0, column: 0 }] }
      }

      return { ok: false, errors: [{ message: response.error.message, line: 0, column: 0 }] }
    }

    return { ok: true, machine: response.data.machine }
  }
  catch (err) {
    if (err instanceof WorkerTimeoutError) {
      return { ok: false, errors: [{ message: 'Execution timed out (Possible infinite loop)', line: 0, column: 0 }] }
    }
    return { ok: false, errors: [{ message: `Worker error: ${err instanceof Error ? err.message : String(err)}`, line: 1, column: 1 }] }
  }
  finally {
    worker.terminate()
  }
}
