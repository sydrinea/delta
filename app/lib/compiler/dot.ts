import type { NFA } from "./nfa";
import { EPSILON } from "./constants";

const COLORS = {
  active: "#ff2056", // rose-500
  default: "#18181b", // zinc-900
  edge: "#71717b", // zinc-500
  background: "white",
  activeFontColor: "white",
} as const;

function dotStateStyle(
  state: string,
  nfa: NFA,
  activeStates?: Set<string>,
): string {
  const isAccept = nfa.acceptStates.has(state);
  const isActive = activeStates?.has(state) ?? false;
  const shape = isAccept ? "doublecircle" : "circle";

  if (isActive) {
    return `"${state}" [shape=${shape} style=filled fillcolor="${COLORS.active}" fontcolor="${COLORS.activeFontColor}" color="${COLORS.active}"]`;
  }

  return `"${state}" [shape=${shape} style=filled fillcolor="${COLORS.background}" fontcolor="${COLORS.default}" color="${COLORS.default}"]`;
}

function dotTransitions(nfa: NFA): string {
  return [...nfa.transitions.entries()]
    .flatMap(([from, symbolMap]) =>
      [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
        [...toSet].map(
          (to) =>
            `  "${from}" -> "${to}" [label="${symbol === EPSILON ? "ε" : symbol}"]`,
        ),
      ),
    )
    .join("\n");
}

export function toDot(nfa: NFA, activeStates?: Set<string>): string {
  const states = [...nfa.states]
    .map((s) => `  ${dotStateStyle(s, nfa, activeStates)}`)
    .join("\n");

  const start = `  __start__ [shape=point fillcolor="${COLORS.default}" color="${COLORS.default}"]
  __start__ -> "${nfa.startState}" [color="${COLORS.edge}"]`;

  return `digraph ${nfa.name} {
  rankdir=LR
  bgcolor="${COLORS.background}"
  node [fontname="Helvetica" fontsize=12]
  edge [fontname="Helvetica" fontsize=11 color="${COLORS.edge}" fontcolor="${COLORS.edge}"]

${start}

${states}

${dotTransitions(nfa)}
}`;
}
