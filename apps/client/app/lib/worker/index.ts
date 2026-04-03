import { dispatch } from './dispatcher'
import {
  isWorkerRequest,
  WorkerErrorCodes,
} from './protocol'

globalThis.onmessage = async (event: MessageEvent<unknown>) => {
  const incoming = event.data

  if (!isWorkerRequest(incoming)) {
    globalThis.postMessage({
      id: 'unknown',
      status: 'error',
      error: {
        code: WorkerErrorCodes.InvalidRequest,
        message: 'Worker received an invalid request envelope',
      },
    })
    return
  }

  const response = await dispatch(incoming)
  globalThis.postMessage(response)
}
