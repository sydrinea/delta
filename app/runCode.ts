import { z } from "zod";
import { serialize } from "@/lib/compiler/serialize";

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

export interface ExecutionError {
  message: string;
  line: number;
  column: number;
}

export const runCode = async (
  value: string,
  onValidMachine: (anf: string) => void,
  onError: (error: ExecutionError | null) => void,
) => {
  const worker = new Worker(new URL("./lib/worker.ts", import.meta.url), {
    type: "module",
  });

  const timeout = setTimeout(() => {
    worker.terminate();
    onError({
      message: "Execution timed out (Possible infinite loop)",
      line: 0,
      column: 0,
    });
  }, 5000);

  worker.onmessage = (e) => {
    clearTimeout(timeout);
    const { type, payload } = e.data;

    if (type === "ERROR") {
      for (const error of payload) {
        onError({
          message: error.message.split("\n").join("; "),
          line: error.line,
          column: error.column,
        });
      }
      worker.terminate();
      return;
    }

    const { success } = NFASchema.safeParse(payload);
    if (!success) {
      onError({
        message: "Invalid export. Did you forget to call .build()?",
        line: 0,
        column: 0,
      });
      worker.terminate();
      return;
    }
    onError(null);
    onValidMachine(serialize(payload));
    worker.terminate();
  };

  worker.onerror = (err) => {
    clearTimeout(timeout);
    onError({ message: `Worker error: ${err.message}`, line: 1, column: 1 });
    worker.terminate();
  };

  worker.postMessage({ code: value });
};
