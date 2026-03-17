import type { NFA } from "./nfa";
import { EPSILON } from "./constants";

// Catppuccin Latte
const COLORS = {
  active: "#8839ef", // ctp-mauve
  activeFontColor: "#eff1f5", // ctp-base
  default: "#4c4f69", // ctp-text
  defaultFontColor: "#4c4f69", // ctp-text
  edge: "#9ca0b0", // ctp-overlay0
  background: "#e6e9ef", // ctp-mantle
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

  return `"${state}" [shape=${shape} style=filled fillcolor="${COLORS.background}" fontcolor="${COLORS.defaultFontColor}" color="${COLORS.default}"]`;
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

  return `digraph "${nfa.name}" {
  rankdir=LR
  bgcolor="${COLORS.background}"
  node [fontname="Helvetica" fontsize=12]
  edge [fontname="Helvetica" fontsize=11 color="${COLORS.edge}" fontcolor="${COLORS.edge}"]

${start}

${states}

${dotTransitions(nfa)}
}`;
}
