import z from 'zod'

const MessageSchema = z.object({
  content: z.string(),
  severity: z.enum(['warning', 'error']),
})

const stringSetAdapter = z
  .union([z.set(z.string()), z.array(z.string())])
  .transform<
  Set<string>
>(value => (value instanceof Set ? new Set(value) : new Set(value)))

function stringKeyMapAdapter<V>(valueSchema: z.ZodType<V>) {
  return z
    .union([z.map(z.string(), valueSchema), z.record(z.string(), valueSchema)])
    .transform<
    Map<string, V>
  >(value => (value instanceof Map ? new Map(value) : new Map(Object.entries(value) as [string, V][])))
}

const nfaTransitionsAdapter = stringKeyMapAdapter(
  stringKeyMapAdapter(stringSetAdapter),
)

const tmTransitionsAdapter = stringKeyMapAdapter(
  stringKeyMapAdapter(z.unknown()),
)

export const NFASchema = z.strictObject({
  name: z.string(),
  alphabet: stringSetAdapter,
  states: stringSetAdapter,
  startState: z.string(),
  acceptStates: stringSetAdapter,
  transitions: nfaTransitionsAdapter,
  messages: z.array(MessageSchema),
})

export const TMSchema = z.strictObject({
  name: z.string(),
  alphabet: stringSetAdapter,
  states: stringSetAdapter,
  startState: z.string(),
  acceptStates: stringSetAdapter,
  tapeCount: z.number().int().positive(),
  tapeAlphabet: stringSetAdapter,
  blankSymbol: z.string(),
  transitions: tmTransitionsAdapter,
  messages: z.array(MessageSchema),
})
