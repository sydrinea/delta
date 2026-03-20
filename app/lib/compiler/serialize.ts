import type { NFA } from "./nfa";
import nfa from "./nfa";
import { EPSILON } from "./constants";

const SEP = "|";
const LIST = ";";
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

  // In order for a ANF to be valid, we need something for the alphabet
  const containsEpsilon = [...nfa.transitions.entries()]
    .flatMap(([_, symbolMap]) => [...symbolMap.keys()])
    .find((symbol) => symbol === EPSILON);

  if (containsEpsilon) {
    nfa.alphabet.add(EPSILON);
  }

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
    throw new Error(`Invalid ANF: "${input}"`);
  }

  // Our NFAs do not have epsilon as part of the alphabet
  const alphabet = alphabetStr
    .split(LIST)
    .filter((symbol) => symbol !== EPSILON);

  const builder = nfa(name)
    .alphabet(...alphabet)
    .states(...statesStr.split(LIST))
    .start(startState)
    .accept(...acceptStatesStr.split(LIST));

  if (transitionsStr) {
    for (const t of transitionsStr.split(LIST)) {
      const [from, symbol, to] = t.split(ARROW);
      if (!from || !symbol || !to) {
        throw new Error(`Invalid transition: "${t}"`);
      }
      builder.transition(from, symbol === EPS_TOKEN ? EPSILON : symbol, to);
    }
  }

  return builder.build();
}
