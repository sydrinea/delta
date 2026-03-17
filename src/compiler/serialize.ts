import type { NFA } from "./nfa.js";
import nfa from "./nfa.js";
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
    throw new Error(`Invalid ANF: "${input}"`);
  }

  const builder = nfa(name)
    .alphabet(...alphabetStr.split(LIST))
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
