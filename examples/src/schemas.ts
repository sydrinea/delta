import z from 'zod'

export interface ExampleMeta {
  label: string
  type: 'nfa' | 'tm'
  tests?: TestCase[]
}

export interface TestCase {
  id: string
  input: string
  expected: boolean
}

export const TestCaseSchema = z.object({
  id: z.string(),
  input: z.string(),
  expected: z.boolean(),
})

export const TestCaseArraySchema = z.array(TestCaseSchema)

export const ExampleMetaSchema = z.object({
  label: z.string(),
  type: z.enum(['nfa', 'tm']),
  tests: z.array(TestCaseSchema).optional(),
})

export const ExampleSchema = ExampleMetaSchema.extend({
  key: z.string(),
  path: z.string(),
})
