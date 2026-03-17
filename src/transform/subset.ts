import type { NFA, Message } from "../compiler/nfa.js";
import { epsilonClosure } from "./utils.js";

function stateName(states: Set<string>): string {
  const sorted = [...states].sort();
  return `{${sorted.join(",")}}`;
}

export function subset(nfa: NFA): NFA {
  const initialStates = epsilonClosure(nfa, new Set([nfa.startState]));
  const initialName = stateName(initialStates);

  const dfaStates = new Map<string, Set<string>>();
  const dfaTransitions = new Map<string, Map<string, Set<string>>>();
  const worklist: Set<string>[] = [initialStates];

  dfaStates.set(initialName, initialStates);

  while (worklist.length > 0) {
    const current = worklist.pop()!;
    const currentName = stateName(current);

    if (!dfaTransitions.has(currentName)) {
      dfaTransitions.set(currentName, new Map());
    }

    for (const symbol of nfa.alphabet) {
      const next = new Set<string>();
      for (const nfaState of current) {
        for (const target of nfa.transitions.get(nfaState)?.get(symbol) ?? []) {
          next.add(target);
        }
      }

      const closed = epsilonClosure(nfa, next);
      const nextName = stateName(closed);

      dfaTransitions.get(currentName)!.set(symbol, new Set([nextName]));

      if (!dfaStates.has(nextName)) {
        dfaStates.set(nextName, closed);
        worklist.push(closed);
      }
    }
  }

  const dfaAcceptStates = new Set(
    [...dfaStates.keys()].filter((name) => {
      const nfaStates = dfaStates.get(name)!;
      return [...nfaStates].some((s) => nfa.acceptStates.has(s));
    }),
  );

  const messages: Message[] = [];

  return {
    name: `${nfa.name}__dfa`,
    alphabet: nfa.alphabet,
    states: new Set(dfaStates.keys()),
    startState: initialName,
    acceptStates: dfaAcceptStates,
    transitions: dfaTransitions,
    messages,
  };
}
