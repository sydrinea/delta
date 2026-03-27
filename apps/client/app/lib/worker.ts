import { dispatch } from "./worker/dispatcher";
import {
  WorkerErrorCodes,
  isWorkerRequest,
} from "../../../../packages/proto/src";

self.onmessage = async (event: MessageEvent<unknown>) => {
  const incoming = event.data;

  if (!isWorkerRequest(incoming)) {
    self.postMessage({
      id: "unknown",
      status: "error",
      error: {
        code: WorkerErrorCodes.InvalidRequest,
        message: "Worker received an invalid request envelope",
      },
    });
    return;
  }

  const response = await dispatch(incoming);
  self.postMessage(response);
};
