import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isWorkerRequest,
  isWorkerResponse,
  WorkerMethods,
  MachineTypes,
  WorkerErrorCodes,
  type WorkerRequest,
} from "@delta/proto";
import { dispatch } from "@/lib/worker/dispatcher";
import { sendWorkerRequest, WorkerTimeoutError } from "@/lib/worker/client";
import { compileHandler } from "@/lib/worker/handlers/compile";

// Mock the compile handler to isolate the dispatcher functionality
vi.mock("@/lib/worker/handlers/compile", () => ({
  compileHandler: vi.fn(),
}));

describe("Worker Protocol", () => {
  it("isWorkerRequest identifies valid requests", () => {
    expect(
      isWorkerRequest({
        id: "123",
        method: WorkerMethods.Compile,
        params: { code: "some code", machineType: MachineTypes.NFA },
      }),
    ).toBe(true);

    // Invalid missing properties
    expect(isWorkerRequest({})).toBe(false);
    expect(isWorkerRequest(null)).toBe(false);
    expect(
      isWorkerRequest({
        id: "123",
        method: WorkerMethods.Compile,
        params: { code: "some code" }, // missing machineType
      }),
    ).toBe(false);
  });

  it("isWorkerResponse identifies valid responses", () => {
    expect(
      isWorkerResponse({
        id: "123",
        status: "success",
        data: { machine: {} },
      }),
    ).toBe(true);

    expect(
      isWorkerResponse({
        id: "123",
        status: "error",
        error: { code: WorkerErrorCodes.Internal, message: "failed" },
      }),
    ).toBe(true);

    expect(isWorkerResponse({})).toBe(false);
    expect(
      isWorkerResponse({
        id: "123", // missing status
      }),
    ).toBe(false);
  });
});

describe("Worker Dispatcher", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns execution success on valid compile request", async () => {
    vi.mocked(compileHandler).mockResolvedValueOnce({
      machine: "mock_machine",
    });

    const req: WorkerRequest = {
      id: "req1",
      method: WorkerMethods.Compile,
      params: { code: "code", machineType: MachineTypes.NFA },
    };

    const res = await dispatch(req);

    expect(res.id).toBe("req1");
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data.machine).toBe("mock_machine");
    }
  });

  it("returns UnknownMethod error for invalid methods", async () => {
    const req: any = {
      id: "req_bad",
      method: "unknown_method",
      params: {},
    };

    const res = await dispatch(req);

    expect(res.status).toBe("error");
    if (res.status === "error") {
      expect(res.error.code).toBe(WorkerErrorCodes.UnknownMethod);
    }
  });

  it("catches standard errors and returns Internal error code", async () => {
    vi.mocked(compileHandler).mockRejectedValueOnce(
      new Error("Generic Failure"),
    );

    const req: WorkerRequest = {
      id: "req2",
      method: WorkerMethods.Compile,
      params: { code: "code", machineType: MachineTypes.NFA },
    };

    const res = await dispatch(req);

    expect(res.status).toBe("error");
    if (res.status === "error") {
      expect(res.error.code).toBe(WorkerErrorCodes.Internal);
      expect(res.error.message).toBe("Generic Failure");
    }
  });
});

describe("Worker Client", () => {
  let mockWorker: Worker;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWorker = {
      postMessage: vi.fn(),
      onmessage: null,
      onerror: null,
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves when worker replies with correct ID", async () => {
    const request: WorkerRequest = {
      id: "sync1",
      method: WorkerMethods.Compile,
      params: { code: "ok", machineType: MachineTypes.TM },
    };

    const promise = sendWorkerRequest(mockWorker, request, 1000);

    // Simulate worker replying
    if (mockWorker.onmessage) {
      mockWorker.onmessage({
        data: {
          id: "sync1",
          status: "success",
          data: { machine: "built_machine" },
        },
      } as any);
    }

    const res = await promise;
    expect(res.status).toBe("success");
  });

  it("rejects on WorkerTimeoutError if no response within timeout", async () => {
    const request: WorkerRequest = {
      id: "sync2",
      method: WorkerMethods.Compile,
      params: { code: "slow", machineType: MachineTypes.NFA },
    };

    const promise = sendWorkerRequest(mockWorker, request, 1000);

    vi.advanceTimersByTime(1100); // Trigger timeout

    await expect(promise).rejects.toThrow(WorkerTimeoutError);
  });

  it("ignores responses with mismatched IDs", async () => {
    const request: WorkerRequest = {
      id: "sync3",
      method: WorkerMethods.Compile,
      params: { code: "req", machineType: MachineTypes.NFA },
    };

    const promise = sendWorkerRequest(mockWorker, request, 1000);

    if (mockWorker.onmessage) {
      // Send a random message
      mockWorker.onmessage({
        data: {
          id: "different_id",
          status: "success",
          data: {},
        },
      } as any);
    }

    // Should not have resolved, advance timer to see it timeout instead
    vi.advanceTimersByTime(1100);
    await expect(promise).rejects.toThrow(WorkerTimeoutError);
  });
});
