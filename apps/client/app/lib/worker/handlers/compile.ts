import { convertToDFA } from "@delta/transform";
import {
  EPS,
  nfa,
  dfa,
  tm,
  multitape,
  thompson,
  grammar,
  q,
  union,
  concat,
  star,
  char,
  epsilon,
} from "@delta/build";
import {
  WorkerDispatchError,
  WorkerErrorCodes,
  type CompileErrorDetail,
  type CompileParams,
  type CompileSuccessData,
  type ExecutionErrorPayload,
} from "../protocol";

const api = {
  nfa,
  dfa,
  tm,
  multitape,
  thompson,
  grammar,
  convertToDFA,
  EPS,
  q,
  union,
  concat,
  star,
  char,
  epsilon,
};

const workerScope = self as typeof self & { _deltaAPI?: typeof api };
workerScope._deltaAPI = api;

const virtualLibraryCode = `
  const api = self._deltaAPI;
  export const nfa = api.nfa;
  export const dfa = api.dfa;
  export const tm = api.tm;
  export const multitape = api.multitape;
  export const thompson = api.thompson;
  export const grammar = api.grammar;
  export const convertToDFA = api.convertToDFA;
  export const EPS = api.EPS;
  export const q = api.q;
  export const union = api.union;
  export const concat = api.concat;
  export const star = api.star;
  export const char = api.char;
  export const epsilon = api.epsilon;

  export default api;
`;

const libBlob = new Blob([virtualLibraryCode], { type: "text/javascript" });
const libUrl = URL.createObjectURL(libBlob);

interface BuildMessageShape {
  severity?: string;
  content?: string;
  stack?: string;
}

interface BuildErrorShape {
  name?: string;
  message?: string;
  stack?: string;
  messages?: BuildMessageShape[];
}

const BUILD_ERROR_NAMES = new Set([
  "NFABuildError",
  "TMBuildError",
  "RegularGrammarBuildError",
]);

function isBuildErrorShape(value: unknown): value is BuildErrorShape {
  if (!value || typeof value !== "object") return false;
  return true;
}

function parseLocation(stack: string | undefined, userUrl: string) {
  let line = 0;
  let column = 0;

  if (stack && userUrl) {
    const escapedUrl = userUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = stack.match(new RegExp(`${escapedUrl}:(\\d+):(\\d+)`));
    if (match) {
      line = parseInt(match[1], 10);
      column = parseInt(match[2], 10);
    }
  }

  return { line, column };
}

function toExecutionErrors(
  err: unknown,
  userUrl: string,
): ExecutionErrorPayload[] {
  if (
    isBuildErrorShape(err) &&
    err.name &&
    BUILD_ERROR_NAMES.has(err.name) &&
    Array.isArray(err.messages)
  ) {
    return err.messages
      .filter((m) => m.severity === "error")
      .map((m) => {
        const { line, column } = parseLocation(m.stack, userUrl);
        return { message: m.content ?? "Build error", line, column };
      });
  }

  const fallbackMessage =
    err instanceof Error
      ? err.message
      : isBuildErrorShape(err)
        ? err.message || String(err)
        : String(err);
  const fallbackStack =
    err instanceof Error
      ? err.stack
      : isBuildErrorShape(err)
        ? err.stack
        : undefined;

  const { line, column } = parseLocation(fallbackStack, userUrl);
  return [
    {
      message: fallbackMessage,
      line,
      column,
    },
  ];
}

export async function compileHandler(
  params: CompileParams,
): Promise<CompileSuccessData> {
  if (!params?.code || typeof params.code !== "string") {
    throw new WorkerDispatchError(
      WorkerErrorCodes.InvalidRequest,
      "Missing required compile parameter: code",
    );
  }

  let userUrl = "";

  try {
    const executableCode = params.code.replace(
      /(import\s+[\s\S]*?\s+from\s+)["'](@delta\/lib|delta:lib)["']/g,
      `$1"${libUrl}"`,
    );

    const userBlob = new Blob([executableCode], { type: "text/javascript" });
    userUrl = URL.createObjectURL(userBlob);

    const nativeImport = new Function("url", "return import(url);");
    const userModule = await nativeImport(userUrl);

    const machine = userModule.default;
    if (!machine) {
      throw new Error(
        "No default export found. Did you use `export default machine;`?",
      );
    }

    return { machine };
  } catch (err: unknown) {
    const errors = toExecutionErrors(err, userUrl);

    throw new WorkerDispatchError<CompileErrorDetail>(
      WorkerErrorCodes.ExecutionError,
      "Compilation failed",
      { errors },
    );
  } finally {
    if (userUrl) {
      URL.revokeObjectURL(userUrl);
    }
  }
}
