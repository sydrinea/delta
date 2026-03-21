import { EPSILON } from "./constants";
import { NFA } from "./nfa";

export function nfaToCode(nfa: NFA): string {
  const alphabet = [...nfa.alphabet].map((s) => `"${s}"`).join(", ");
  const states = [...nfa.states].map((s) => `"${s}"`).join(", ");
  const accept = [...nfa.acceptStates].map((s) => `"${s}"`).join(", ");

  const hasEpsilon = [...nfa.transitions.values()].some((symbolMap) =>
    symbolMap.has(EPSILON),
  );

  const imports = ["nfa"];
  if (hasEpsilon) imports.push("EPS");

  const transitions = [...nfa.transitions.entries()].flatMap(
    ([from, symbolMap]) =>
      [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
        [...toSet].map(
          (to) =>
            `  .transition("${from}", ${symbol === EPSILON ? "EPS" : `"${symbol}"`}, "${to}")`,
        ),
      ),
  );

  return [
    `import { ${imports.join(", ")} } from "delta:lib";`,
    ``,
    `const machine = nfa("${nfa.name}")`,
    `  .alphabet(${alphabet})`,
    `  .states(${states})`,
    `  .start("${nfa.startState}")`,
    `  .accept(${accept})`,
    ...transitions,
    `  .build();`,
    ``,
    `export default machine;`,
  ].join("\n");
}
