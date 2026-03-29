import { NFA, TuringMachine, EPSILON } from "@delta/build";
import {
  buildTMTransitionRows,
  formatReadTuple,
} from "../components/visualize/metadata";
import { Theme } from "./theme";
import { flavors } from "@catppuccin/palette";

const COLORS = {
  latte: {
    active: flavors.latte.colors.mauve.hex,
    activeFontColor: flavors.latte.colors.base.hex,
    default: flavors.latte.colors.text.hex,
    defaultFontColor: flavors.latte.colors.text.hex,
    edge: flavors.latte.colors.text.hex,
    background: flavors.latte.colors.mantle.hex,
  },
  mocha: {
    active: flavors.mocha.colors.mauve.hex,
    activeFontColor: flavors.mocha.colors.base.hex,
    default: flavors.mocha.colors.text.hex,
    defaultFontColor: flavors.mocha.colors.text.hex,
    edge: flavors.mocha.colors.text.hex,
    background: flavors.mocha.colors.mantle.hex,
  },
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
  theme: Theme,
  activeStates?: Set<string>,
): string {
  const isAccept = machine.acceptStates.has(state);
  const isActive = activeStates?.has(state) ?? false;
  const shape = isAccept ? "doublecircle" : "circle";
  const palette = COLORS[theme];

  if (isActive) {
    return `"${state}" [shape=${shape} style=filled fillcolor="${palette.active}" fontcolor="${palette.activeFontColor}" color="${palette.active}"]`;
  }

  return `"${state}" [shape=${shape} style=filled fillcolor="${palette.background}" fontcolor="${palette.defaultFontColor}" color="${palette.default}"]`;
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
  theme: Theme,
  activeStates?: Set<string>,
  graphAttributes: string[] = [],
): string {
  const palette = COLORS[theme];

  const states = [...machine.states]
    .map((s) => `  ${dotMachineStateStyle(s, machine, theme, activeStates)}`)
    .join("\n");

  const start = `  __start__ [shape=point fillcolor="${palette.default}" color="${palette.default}"]\n  __start__ -> "${machine.startState}" [color="${palette.edge}"]`;
  const attrs =
    graphAttributes.length > 0 ? `\n  ${graphAttributes.join("\n  ")}` : "";

  return `digraph "${machine.name}" {
  rankdir=LR${attrs}
  bgcolor="${palette.background}"
  node [fontname="Helvetica" fontsize=12]
  edge [fontname="Helvetica" fontsize=11 color="${palette.edge}" fontcolor="${palette.edge}"]

${start}

${states}

${transitions(machine)}
}`;
}

export function toDot(
  nfa: NFA,
  theme: Theme,
  activeStates?: Set<string>,
): string {
  return toDotWithStyle(nfa, dotTransitions, theme, activeStates);
}

export function toDotTM(
  tm: TuringMachine<any>,
  theme: Theme,
  activeStates?: Set<string>,
): string {
  return toDotWithStyle(tm, dotTMTransitions, theme, activeStates, [
    "splines=true",
    "overlap=false",
    "concentrate=false",
    "nodesep=0.45",
    "ranksep=0.6",
  ]);
}
