import type { NFA } from "./nfa.js";
import { EPSILON } from "./constants.js";

const SEP = "|";
const LIST = ",";
const ARROW = ">";
const EPS_TOKEN = "eps";

export function serialize(nfa: NFA): string {
  const transitions = [...nfa.transitions.entries()]
    .flatMap(([from, symbolMap]) =>
      [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
        [...toSet].map(
          (to) =>
            `${from}${ARROW}${symbol === EPSILON ? EPS_TOKEN : symbol}${ARROW}${to}`,
        ),
      ),
    )
    .join(LIST);

  return [
    nfa.name,
    [...nfa.states].join(LIST),
    [...nfa.alphabet].join(LIST),
    nfa.startState,
    [...nfa.acceptStates].join(LIST),
    transitions,
  ].join(SEP);
}

export function deserialize(input: string): NFA {
  const [
    name,
    statesStr,
    alphabetStr,
    startState,
    acceptStatesStr,
    transitionsStr,
  ] = input.split(SEP);

  if (!name || !statesStr || !alphabetStr || !startState || !acceptStatesStr) {
    throw new Error(`Invalid serialized NFA: "${input}"`);
  }

  const states = new Set(statesStr.split(LIST));
  const alphabet = new Set(alphabetStr.split(LIST));
  const acceptStates = new Set(acceptStatesStr.split(LIST));

  const transitions = new Map<string, Map<string, Set<string>>>();
  for (const state of states) {
    transitions.set(state, new Map());
  }

  if (transitionsStr) {
    for (const t of transitionsStr.split(LIST)) {
      const [from, symbol, to] = t.split(ARROW);
      if (!from || !symbol || !to) {
        throw new Error(`Invalid transition: "${t}"`);
      }

      const canonicalSymbol = symbol === EPS_TOKEN ? EPSILON : symbol;
      const fromMap = transitions.get(from);
      if (!fromMap) {
        throw new Error(`Transition references undeclared state: "${from}"`);
      }

      if (!fromMap.has(canonicalSymbol)) {
        fromMap.set(canonicalSymbol, new Set());
      }
      fromMap.get(canonicalSymbol)!.add(to);
    }
  }

  return {
    name,
    alphabet,
    states,
    startState,
    acceptStates,
    transitions,
    messages: [],
  };
}
