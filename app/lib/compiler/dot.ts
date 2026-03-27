import type { NFA } from "./nfa";
import type { TuringMachine } from "./tm";
import { EPSILON } from "./constants";
import { buildTMTransitionRows, formatReadTuple } from "./metadata";

// Catppuccin Latte
const COLORS = {
  active: "#8839ef", // ctp-mauve
  activeFontColor: "#eff1f5", // ctp-base
  default: "#4c4f69", // ctp-text
  defaultFontColor: "#4c4f69", // ctp-text
  edge: "#4c4f69", // ctp-text
  background: "#e6e9ef", // ctp-mantle
} as const;

interface DotMachineBase {
  name: string;
  states: Set<string>;
  startState: string;
  acceptStates: Set<string>;
}

function dotMachineStateStyle(
  state: string,
  machine: DotMachineBase,
  activeStates?: Set<string>,
): string {
  const isAccept = machine.acceptStates.has(state);
  const isActive = activeStates?.has(state) ?? false;
  const shape = isAccept ? "doublecircle" : "circle";

  if (isActive) {
    return `"${state}" [shape=${shape} style=filled fillcolor="${COLORS.active}" fontcolor="${COLORS.activeFontColor}" color="${COLORS.active}"]`;
  }

  return `"${state}" [shape=${shape} style=filled fillcolor="${COLORS.background}" fontcolor="${COLORS.defaultFontColor}" color="${COLORS.default}"]`;
}

function dotTransitions(nfa: NFA): string {
  const edgeMap = new Map<string, string[]>();

  for (const [from, symbolMap] of nfa.transitions) {
    for (const [symbol, toSet] of symbolMap) {
      for (const to of toSet) {
        const key = `${from}→${to}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, []);
        }
        edgeMap.get(key)!.push(symbol === EPSILON ? "ε" : symbol);
      }
    }
  }

  return [...edgeMap.entries()]
    .map(([key, symbols]) => {
      const [from, to] = key.split("→");
      return `  "${from}" -> "${to}" [label="${symbols.join(", ")}"]`;
    })
    .join("\n");
}

function dotTMTransitions(tm: TuringMachine<any>): string {
  const edgeMap = new Map<
    string,
    { edgeId: string; fromState: string; toState: string; labels: Set<string> }
  >();

  for (const row of buildTMTransitionRows(tm)) {
    const existing = edgeMap.get(row.edgeKey);
    if (existing) {
      existing.labels.add(formatReadTuple(row.readSymbols));
      continue;
    }

    edgeMap.set(row.edgeKey, {
      edgeId: row.edgeId,
      fromState: row.fromState,
      toState: row.toState,
      labels: new Set([formatReadTuple(row.readSymbols)]),
    });
  }

  return [...edgeMap.values()]
    .map((edge) => {
      const label = [...edge.labels].sort().join("\\n");
      return `  "${edge.fromState}" -> "${edge.toState}" [id="${edge.edgeId}" label="${label}"]`;
    })
    .join("\n");
}

function toDotWithStyle<T extends DotMachineBase>(
  machine: T,
  transitions: (machine: T) => string,
  activeStates?: Set<string>,
  graphAttributes: string[] = [],
): string {
  const states = [...machine.states]
    .map((s) => `  ${dotMachineStateStyle(s, machine, activeStates)}`)
    .join("\n");

  const start = `  __start__ [shape=point fillcolor="${COLORS.default}" color="${COLORS.default}"]\n  __start__ -> "${machine.startState}" [color="${COLORS.edge}"]`;
  const attrs =
    graphAttributes.length > 0 ? `\n  ${graphAttributes.join("\n  ")}` : "";

  return `digraph "${machine.name}" {
  rankdir=LR${attrs}
  bgcolor="${COLORS.background}"
  node [fontname="Helvetica" fontsize=12]
  edge [fontname="Helvetica" fontsize=11 color="${COLORS.edge}" fontcolor="${COLORS.edge}"]

${start}

${states}

${transitions(machine)}
}`;
}

export function toDot(nfa: NFA, activeStates?: Set<string>): string {
  return toDotWithStyle(nfa, dotTransitions, activeStates);
}

export function toDotTM(
  tm: TuringMachine<any>,
  activeStates?: Set<string>,
): string {
  return toDotWithStyle(tm, dotTMTransitions, activeStates, [
    "splines=true",
    "overlap=false",
    "concentrate=false",
    "nodesep=0.45",
    "ranksep=0.6",
  ]);
}
