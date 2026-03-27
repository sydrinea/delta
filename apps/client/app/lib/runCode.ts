import { z } from "zod";
import type { NFA } from "@delta/build";
import type { TuringMachine } from "@delta/build";
import {
  createWorkerRequestId,
  sendWorkerRequest,
  WorkerTimeoutError,
} from "@/lib/worker/client";
import {
  WorkerErrorCodes,
  WorkerMethods,
  type MachineType,
  type CompileErrorDetail,
  type CompileSuccessData,
} from "@/lib/worker/protocol";

const MessageSchema = z.object({
  content: z.string(),
  severity: z.enum(["warning", "error"]),
});

export const NFASchema = z.object({
  name: z.string(),
  alphabet: z.instanceof(Set),
  states: z.instanceof(Set),
  startState: z.string(),
  acceptStates: z.instanceof(Set),
  transitions: z.instanceof(Map),
  messages: z.array(MessageSchema),
});

export const TMSchema = z
  .object({
    name: z.string(),
    alphabet: z.instanceof(Set),
    states: z.instanceof(Set),
    startState: z.string(),
    acceptStates: z.instanceof(Set),
    tapeAlphabet: z.instanceof(Set),
    blankSymbol: z.string(),
    transitions: z.instanceof(Map),
    messages: z.array(MessageSchema),
  })
  .passthrough();

export interface ExecutionError {
  message: string;
  line: number;
  column: number;
}

const validateMachine = <M extends NFA | TuringMachine>(
  payload: unknown,
  schema: z.ZodType,
  machineType: MachineType,
  onError: (errors: ExecutionError[] | null) => void,
  onValidMachine: (machine: M) => void,
): boolean => {
  const parse = schema.safeParse(payload);
  if (!parse.success) {
    onError([
      {
        message: `Invalid ${machineType.toUpperCase()} export. Did you forget to call .build()?`,
        line: 0,
        column: 0,
      },
    ]);
    return false;
  }

  onError(null);
  onValidMachine(parse.data as M);
  return true;
};

export const runCode = async <M extends NFA | TuringMachine>(
  value: string,
  machineType: MachineType,
  onValidMachine: (machine: M) => void,
  onError: (errors: ExecutionError[] | null) => void,
) => {
  const worker = new Worker(new URL("./worker/index.ts", import.meta.url), {
    type: "module",
  });

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
    );

    if (response.status === "error") {
      const compilationErrors = response.error.details?.errors;
      if (Array.isArray(compilationErrors) && compilationErrors.length > 0) {
        onError(
          compilationErrors.map((error: ExecutionError) => ({
            message: error.message.split("\n").join("; "),
            line: error.line,
            column: error.column,
          })),
        );
        return;
      }

      if (response.error.code === WorkerErrorCodes.Timeout) {
        onError([
          {
            message: "Execution timed out (Possible infinite loop)",
            line: 0,
            column: 0,
          },
        ]);
        return;
      }

      onError([
        {
          message: response.error.message,
          line: 0,
          column: 0,
        },
      ]);
      return;
    }

    const payload = response.data.machine;
    const schema = { nfa: NFASchema, tm: TMSchema };
    validateMachine(
      payload,
      schema[machineType],
      machineType,
      onError,
      onValidMachine,
    );
  } catch (err) {
    if (err instanceof WorkerTimeoutError) {
      onError([
        {
          message: "Execution timed out (Possible infinite loop)",
          line: 0,
          column: 0,
        },
      ]);
      return;
    }

    onError([
      {
        message: `Worker error: ${err instanceof Error ? err.message : String(err)}`,
        line: 1,
        column: 1,
      },
    ]);
  } finally {
    worker.terminate();
  }
};
