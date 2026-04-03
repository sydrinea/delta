import type { WorkerRequest, WorkerResponse } from './protocol'
import {
  isWorkerResponse,
  WorkerDispatchError,
  WorkerErrorCodes,

} from './protocol'

export class WorkerTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkerTimeoutError'
  }
}

export function createWorkerRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function sendWorkerRequest<TData = unknown, TDetail = unknown>(
  worker: Worker,
  request: WorkerRequest,
  timeoutMs: number,
): Promise<WorkerResponse<TData, TDetail>> {
  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>

    const cleanup = () => {
      clearTimeout(timeout)
      worker.onmessage = null
      worker.onerror = null
    }

    timeout = setTimeout(() => {
      cleanup()
      reject(
        new WorkerTimeoutError('Execution timed out (Possible infinite loop)'),
      )
    }, timeoutMs)

    worker.onmessage = (event: MessageEvent<unknown>) => {
      const payload = event.data

      if (!isWorkerResponse(payload)) {
        cleanup()
        reject(
          new WorkerDispatchError(
            WorkerErrorCodes.InvalidResponse,
            'Worker returned an invalid response envelope',
          ),
        )
        return
      }

      if (payload.id !== request.id) {
        return
      }

      cleanup()
      resolve(payload as WorkerResponse<TData, TDetail>)
    }

    worker.onerror = (error) => {
      cleanup()
      reject(new Error(error.message || 'Worker error'))
    }

    worker.postMessage(request)
  })
}
