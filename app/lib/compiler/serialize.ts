import type { NFA } from "./nfa";
import nfa from "./nfa";
import { EPSILON } from "./constants";

const SEP = "|";
const LIST = ";";
const ARROW = ">";
const EPS_TOKEN = "eps";

const enc = encodeURIComponent;
const dec = decodeURIComponent;

export function serialize(nfa: NFA): string {
  const transitions = [...nfa.transitions.entries()]
    .flatMap(([from, symbolMap]) =>
      [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
        [...toSet].map((to) => {
          const safeSymbol = symbol === EPSILON ? EPS_TOKEN : enc(symbol);
          return `${enc(from)}${ARROW}${safeSymbol}${ARROW}${enc(to)}`;
        }),
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
    enc(nfa.name),
    [...nfa.states].map(enc).join(LIST),
    [...nfa.alphabet].map(enc).join(LIST),
    enc(nfa.startState),
    [...nfa.acceptStates].map(enc).join(LIST),
    transitions,
  ].join(SEP);
}

export function deserialize(input: string): NFA {
  const [
    nameStr,
    statesStr,
    alphabetStr,
    startStateStr,
    acceptStatesStr,
    transitionsStr,
  ] = input.split(SEP);

  if (!nameStr || !statesStr || !startStateStr) {
    throw new Error(`Invalid ANF: "${input}"`);
  }

  const alphabet = alphabetStr
    ? alphabetStr
        .split(LIST)
        .map(dec)
        .filter((symbol) => symbol !== EPSILON)
    : [];

  const acceptStates = acceptStatesStr
    ? acceptStatesStr.split(LIST).map(dec)
    : [];

  const builder = nfa(dec(nameStr))
    .alphabet(...alphabet)
    .states(...statesStr.split(LIST).map(dec))
    .start(dec(startStateStr))
    .accept(...acceptStates);

  if (transitionsStr) {
    for (const t of transitionsStr.split(LIST)) {
      const [from, symbol, to] = t.split(ARROW);
      if (!from || !symbol || !to) {
        throw new Error(`Invalid transition: "${t}"`);
      }

      const decodedSymbol = symbol === EPS_TOKEN ? EPSILON : dec(symbol);
      builder.transition(dec(from), decodedSymbol, dec(to));
    }
  }

  return builder.build();
}
