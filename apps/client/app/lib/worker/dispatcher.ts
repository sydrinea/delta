import type { CompileErrorDetail, CompileSuccessData, WorkerRequest, WorkerResponse } from './protocol'
import { compileHandler } from './handlers/compile'
import {

  WorkerDispatchError,
  WorkerErrorCodes,
  WorkerMethods,

} from './protocol'

type DispatchResponse = WorkerResponse<CompileSuccessData, CompileErrorDetail>

export async function dispatch(
  request: WorkerRequest,
): Promise<DispatchResponse> {
  const started = performance.now()

  try {
    if (request.method === WorkerMethods.Compile) {
      const data = await compileHandler(request.params)
      return {
        id: request.id,
        status: 'success',
        data,
        meta: { durationMs: performance.now() - started },
      }
    }

    return {
      id: request.id,
      status: 'error',
      error: {
        code: WorkerErrorCodes.UnknownMethod,
        message: `Unknown method: ${request.method}`,
      },
      meta: { durationMs: performance.now() - started },
    }
  }
  catch (error) {
    if (error instanceof WorkerDispatchError) {
      return {
        id: request.id,
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
          details: error.details as CompileErrorDetail,
        },
        meta: { durationMs: performance.now() - started },
      }
    }

    return {
      id: request.id,
      status: 'error',
      error: {
        code: WorkerErrorCodes.Internal,
        message: error instanceof Error ? error.message : String(error),
      },
      meta: { durationMs: performance.now() - started },
    }
  }
}
