import type { NFA, Message } from "@delta/build";
import { epsilonClosure } from "./utils";

function stateName(preserve: boolean): (states: Set<string>) => string {
  let stateNum = 0;
  return (states: Set<string>) => {
    if (!preserve) return `q${stateNum++}`;
    const sorted = [...states].sort();
    return `{${sorted.join(",")}}`;
  };
}

interface ConvertOptions {
  name?: string;
  preserveNames?: boolean;
}

export function convertToDFA(nfa: NFA, options: ConvertOptions = {}): NFA {
  const { name = `${nfa.name}__dfa`, preserveNames = true } = options;
  const subsetToName = new Map<string, string>();

  const getDfaName = (states: Set<string>) => {
    const key = [...states].sort().join(",");
    if (!subsetToName.has(key)) {
      subsetToName.set(key, nextStateName(states));
    }
    return subsetToName.get(key)!;
  };

  const initialStates = epsilonClosure(nfa, new Set([nfa.startState]));
  const nextStateName = stateName(preserveNames);
  const initialName = getDfaName(initialStates);

  const dfaStates = new Map<string, Set<string>>();
  const dfaTransitions = new Map<string, Map<string, Set<string>>>();
  const worklist: Set<string>[] = [initialStates];

  dfaStates.set(initialName, initialStates);

  while (worklist.length > 0) {
    const current = worklist.pop()!;
    const currentName = getDfaName(current);

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
      const nextName = getDfaName(closed);

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
    name,
    alphabet: nfa.alphabet,
    states: new Set(dfaStates.keys()),
    startState: initialName,
    acceptStates: dfaAcceptStates,
    transitions: dfaTransitions,
    messages,
  };
}
