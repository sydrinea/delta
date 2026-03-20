import { z } from "zod";
import nfa from "@/lib/compiler/nfa";
import dfa from "@/lib/compiler/dfa";
import { serialize } from "@/lib/compiler/serialize";
import { EPS } from "@/lib/compiler/constants";
import { q, union, concat, star, char, epsilon } from "@/lib/compiler/helpers";
import { thompson } from "@/lib/compiler/thompson";

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

export const runCode = (
  value: string,
  onValidMachine: (anf: string) => void,
  onError: (error: string | null) => void,
) => {
  const Delta = {
    nfa,
    dfa,
    thompson,
    EPS,
    q,
    union,
    concat,
    star,
    char,
    epsilon,
  };
  try {
    const result = new Function("Delta", value + "\n; return machine;")(Delta);
    const { success } = NFASchema.safeParse(result);
    if (!success) {
      onError("✗ did you forget to call .build()?");
      return;
    }
    onError(null);
    onValidMachine(serialize(result));
  } catch (e) {
    onError(`✗ ${String(e).split("\n").join("; ")}`);
  }
};
