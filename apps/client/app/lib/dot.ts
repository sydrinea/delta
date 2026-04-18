import type { NFA, PDA, TuringMachine } from '@delta/build'
import { EPSILON } from '@delta/build'
import {
  buildTMTransitionRows,
  formatReadTuple,
} from './tm-metadata'

export interface DotMachineBase {
  name: string
  states: Set<string>
  startState: string
  acceptStates: Set<string>
}

interface DotEdge {
  from: string
  to: string
  label: string
  /** Present on TM edges — used by the visualizer to highlight active transitions. */
  edgeId?: string
}

export interface DotConfig<M extends DotMachineBase> {
  edges: (machine: M) => Iterable<DotEdge>
  graphAttrs?: string[]
  sortLabels?: boolean
}

function dotMachineStateStyle(
  state: string,
  machine: DotMachineBase,
  activeStates?: Set<string>,
): string {
  const isAccept = machine.acceptStates.has(state)
  const isActive = activeStates?.has(state) ?? false
  const shape = isAccept ? 'doublecircle' : 'circle'

  if (isActive) {
    return `"${state}" [shape=${shape} class="state active"]`
  }

  return `"${state}" [shape=${shape} class="state default"]`
}

function* nfaEdges(nfa: NFA): Iterable<DotEdge> {
  for (const [from, symbolMap] of nfa.transitions) {
    for (const [symbol, toSet] of symbolMap) {
      for (const to of toSet)
        yield { from, to, label: symbol === EPSILON ? 'ε' : symbol }
    }
  }
}

function* pdaEdges(pda: PDA): Iterable<DotEdge> {
  for (const [from, keyMap] of pda.transitions) {
    for (const t of keyMap.values()) {
      const input = t.inputSymbol === EPSILON ? 'ε' : t.inputSymbol
      const pop = t.stackPop === EPSILON ? 'ε' : t.stackPop
      const push = t.stackPush.length === 0 ? 'ε' : t.stackPush.join('')
      yield { from, to: t.toState, label: `${input}, ${pop} → ${push}` }
    }
  }
}

function* tmEdges(tm: TuringMachine<number>): Iterable<DotEdge> {
  for (const row of buildTMTransitionRows(tm))
    yield { from: row.fromState, to: row.toState, label: formatReadTuple(row.readSymbols), edgeId: row.edgeId }
}

function buildEdgeLines(edges: Iterable<DotEdge>, sortLabels = false): string {
  const edgeMap = new Map<string, { from: string, to: string, edgeId: string | undefined, labels: string[] }>()

  for (const { from, to, label, edgeId } of edges) {
    const key = `${from}→${to}`
    if (!edgeMap.has(key))
      edgeMap.set(key, { from, to, edgeId, labels: [] })
    edgeMap.get(key)!.labels.push(label)
  }

  return Array.from(edgeMap.values(), ({ from, to, edgeId, labels }) => {
    const ordered = sortLabels ? [...labels].sort() : labels
    const idAttr = edgeId ? `id="${edgeId}" ` : ''
    return `  "${from}" -> "${to}" [${idAttr}label="${ordered.join(',')}"]`
  }).join('\n')
}

export const nfaDotConfig: DotConfig<NFA> = {
  edges: nfaEdges,
}

export const pdaDotConfig: DotConfig<PDA> = {
  edges: pdaEdges,
}

export const tmDotConfig: DotConfig<TuringMachine<number>> = {
  edges: tmEdges,
  sortLabels: true,
  graphAttrs: [
    'splines=true',
    'overlap=false',
    'concentrate=false',
    'nodesep=0.45',
    'ranksep=0.6',
  ],
}

export function toDot<M extends DotMachineBase>(
  machine: M,
  config: DotConfig<M>,
  _theme: any, // kept for signature backwards compatibility temporarily
  activeStates?: Set<string>,
): string {
  const attrs = config.graphAttrs?.length
    ? `\n  ${config.graphAttrs.join('\n  ')}`
    : ''

  const states = Array.from(
    machine.states,
    s => `  ${dotMachineStateStyle(s, machine, activeStates)}`,
  ).join('\n')

  const start = `  __start__ [shape=point class="start-point"]\n  __start__ -> "${machine.startState}" [class="start-edge"]`

  return `digraph "${machine.name}" {
  rankdir=LR${attrs}
  class="graph-machine"
  node [fontname="Helvetica" fontsize=12]
  edge [fontname="Helvetica" fontsize=11 class="transition"]

${start}

${states}

${buildEdgeLines(config.edges(machine), config.sortLabels)}
}`
}
