import z from "zod";

const MessageSchema = z.object({
  content: z.string(),
  severity: z.enum(["warning", "error"]),
});

export const NFASchema = z.strictObject({
  name: z.string(),
  alphabet: z.instanceof(Set<string>),
  states: z.instanceof(Set<string>),
  startState: z.string(),
  acceptStates: z.instanceof(Set<string>),
  transitions: z.instanceof(Map<string, Map<string, Set<string>>>),
  messages: z.array(MessageSchema),
});

export const TMSchema = z.strictObject({
  name: z.string(),
  alphabet: z.instanceof(Set<string>),
  states: z.instanceof(Set<string>),
  startState: z.string(),
  acceptStates: z.instanceof(Set<string>),
  tapeCount: z.number().int().positive(),
  tapeAlphabet: z.instanceof(Set<string>),
  blankSymbol: z.string(),
  transitions: z.instanceof(Map<string, Map<string, unknown>>),
  messages: z.array(MessageSchema),
});
