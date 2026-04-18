import type { CompileErrorDetail, CompileParams, CompileSuccessData, ExecutionErrorPayload } from '../protocol'
import * as build from '@delta/build'
import * as transform from '@delta/transform'
import {

  WorkerDispatchError,
  WorkerErrorCodes,
} from '../protocol'

const api = {
  ...build,
  ...transform,
}

const workerScope = globalThis as typeof globalThis & { _deltaAPI?: typeof api }
workerScope._deltaAPI = api

const virtualLibraryCode = `
  const api = globalThis._deltaAPI;
  ${Object.keys(api)
    .map(key => `export const ${key} = api.${key};`)
    .join('\n  ')}
  export default api;
`

const libBlob = new Blob([virtualLibraryCode], { type: 'text/javascript' })
const libUrl = URL.createObjectURL(libBlob)

interface BuildMessageShape {
  severity?: string
  content?: string
  stack?: string
}

interface BuildErrorShape {
  name?: string
  message?: string
  stack?: string
  messages?: BuildMessageShape[]
}

const BUILD_ERROR_NAMES = new Set([
  'NFABuildError',
  'PDABuildError',
  'TMBuildError',
  'RegularGrammarBuildError',
])

function isBuildErrorShape(value: unknown): value is BuildErrorShape {
  if (!value || typeof value !== 'object')
    return false
  return true
}

function parseLocation(stack: string | undefined, userUrl: string) {
  let line = 0
  let column = 0

  if (stack && userUrl) {
    const escapedUrl = userUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = stack.match(new RegExp(`${escapedUrl}:(\\d+):(\\d+)`))
    if (match) {
      line = Number.parseInt(match[1], 10)
      column = Number.parseInt(match[2], 10)
    }
  }

  return { line, column }
}

function toExecutionErrors(
  err: unknown,
  userUrl: string,
): ExecutionErrorPayload[] {
  if (
    isBuildErrorShape(err)
    && err.name
    && BUILD_ERROR_NAMES.has(err.name)
    && Array.isArray(err.messages)
  ) {
    return err.messages
      .filter(m => m.severity === 'error')
      .map((m) => {
        const { line, column } = parseLocation(m.stack, userUrl)
        return { message: m.content ?? 'Build error', line, column }
      })
  }

  const fallbackMessage
    = err instanceof Error
      ? err.message
      : isBuildErrorShape(err)
        ? err.message || String(err)
        : String(err)
  const fallbackStack
    = err instanceof Error
      ? err.stack
      : isBuildErrorShape(err)
        ? err.stack
        : undefined

  const { line, column } = parseLocation(fallbackStack, userUrl)
  return [
    {
      message: fallbackMessage,
      line,
      column,
    },
  ]
}

export async function compileHandler(
  params: CompileParams,
): Promise<CompileSuccessData> {
  if (!params?.code || typeof params.code !== 'string') {
    throw new WorkerDispatchError(
      WorkerErrorCodes.InvalidRequest,
      'Missing required compile parameter: code',
    )
  }

  let userUrl = ''

  try {
    const executableCode = params.code.replace(
      /(import\s[\s\S]*?\sfrom\s+)["'](@delta\/lib|delta:lib)["']/g,
      `$1"${libUrl}"`,
    )

    const userBlob = new Blob([executableCode], { type: 'text/javascript' })
    userUrl = URL.createObjectURL(userBlob)

    const userModule = await import(/* webpackIgnore: true */ userUrl)

    const machine = userModule.default
    if (!machine) {
      throw new Error(
        'No default export found. Did you use `export default machine;`?',
      )
    }

    return { machine }
  }
  catch (err: unknown) {
    const errors = toExecutionErrors(err, userUrl)

    throw new WorkerDispatchError<CompileErrorDetail>(
      WorkerErrorCodes.ExecutionError,
      'Compilation failed',
      { errors },
    )
  }
  finally {
    if (userUrl) {
      URL.revokeObjectURL(userUrl)
    }
  }
}
