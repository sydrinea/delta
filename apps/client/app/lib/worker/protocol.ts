import z from 'zod'

export const WorkerMethods = {
  Compile: 'compile',
} as const

export type WorkerMethod = (typeof WorkerMethods)[keyof typeof WorkerMethods]

export const MachineTypes = {
  NFA: 'nfa',
  PDA: 'pda',
  TM: 'tm',
} as const

export type MachineType = (typeof MachineTypes)[keyof typeof MachineTypes]

export const WorkerErrorCodes = {
  UnknownMethod: 'UNKNOWN_METHOD',
  InvalidRequest: 'INVALID_REQUEST',
  ExecutionError: 'EXECUTION_ERROR',
  InvalidResponse: 'INVALID_RESPONSE',
  Timeout: 'TIMEOUT',
  Internal: 'INTERNAL',
} as const

export type WorkerErrorCode
  = (typeof WorkerErrorCodes)[keyof typeof WorkerErrorCodes]

export interface ExecutionError {
  message: string
  line: number
  column: number
}

export interface CompileParams {
  code: string
  machineType: MachineType
}

export interface CompileSuccessData {
  machine: unknown
}

export interface CompileErrorDetail {
  errors: ExecutionError[]
}

export interface WorkerSuccessResponse<TData = unknown> {
  id: string
  status: 'success'
  data: TData
  meta?: {
    durationMs: number
  }
}

export interface WorkerErrorResponse<TDetail = unknown> {
  id: string
  status: 'error'
  error: {
    code: WorkerErrorCode
    message: string
    details?: TDetail
  }
  meta?: {
    durationMs: number
  }
}

export type WorkerResponse<TData = unknown, TDetail = unknown>
  = | WorkerSuccessResponse<TData>
    | WorkerErrorResponse<TDetail>

const MachineTypeSchema = z.enum(
  Object.values(MachineTypes) as [MachineType, ...MachineType[]],
)

const WorkerRequestSchema = z.object({
  id: z.string(),
  method: z.string(),
  params: z.object({
    code: z.string(),
    machineType: MachineTypeSchema,
  }),
})

export type WorkerRequest = z.infer<typeof WorkerRequestSchema>

export function isWorkerRequest(value: unknown): value is WorkerRequest {
  return WorkerRequestSchema.safeParse(value).success
}

export function isWorkerResponse(
  value: unknown,
): value is WorkerResponse<CompileSuccessData, CompileErrorDetail> {
  if (!value || typeof value !== 'object')
    return false

  const candidate = value as WorkerResponse<
    CompileSuccessData,
    CompileErrorDetail
  >
  return (
    typeof candidate.id === 'string'
    && (candidate.status === 'success' || candidate.status === 'error')
  )
}

export class WorkerDispatchError<TDetail = unknown> extends Error {
  public readonly code: WorkerErrorCode
  public readonly details?: TDetail

  constructor(code: WorkerErrorCode, message: string, details?: TDetail) {
    super(message)
    this.name = 'WorkerDispatchError'
    this.code = code
    this.details = details
  }
}
