import type { NFA } from '@delta/build'
import type { StreamAdapter } from './core'
import { EPSILON } from '@delta/build'
import { simulate as simulateGeneric } from './core'

export interface SimulationStep {
  /**
   * The input symbol consumed to reach this step, or `null` for the initial
   * state before any input is read.
   */
  symbol: string | null
  states: Set<string>
}

export interface SimulationResult {
  accepted: boolean
  trace: SimulationStep[]
}

/**
 * Build a `StreamAdapter<string>` for an NFA.
 *
 * NFA configurations are bare state strings — there is no additional context
 * to carry between steps. The epsilon expansion in the core loop handles
 * ε-transitions; `symbolStep` handles labeled transitions.
 */
function buildNFAAdapter(nfa: NFA): StreamAdapter<string> {
  return {
    mode: 'stream',
    initial: [nfa.startState],
    acceptStates: nfa.acceptStates,

    // Return the direct ε-successors of a single state. The core loop
    // iterates this to fixpoint, so we only need one hop at a time.
    epsilonStep: state =>
      [...(nfa.transitions.get(state)?.get(EPSILON) ?? [])],

    // State strings are their own keys — no encoding needed.
    configKey: state => state,
    getState: state => state,
    isAccepted: (state, acceptStates) => acceptStates.has(state),

    symbolStep: (state, symbol) =>
      [...(nfa.transitions.get(state)?.get(symbol) ?? [])],
  }
}

/**
 * Simulate an NFA over `input` and return the accepted result with a trace.
 *
 * The trace records the active state set at each position in the input,
 * starting with the epsilon-closure of the start state (step `null`).
 * Each subsequent step corresponds to one consumed input character.
 *
 * @example
 * const result = simulate(machine, 'aab')
 * result.accepted // true / false
 * result.trace    // [{ symbol: null, states }, { symbol: 'a', states }, ...]
 */
export function simulate(nfa: NFA, input: string): SimulationResult {
  const adapter = buildNFAAdapter(nfa)
  const result = simulateGeneric(adapter, input)

  // Map the generic SimulationStep<string> back to the NFA-specific shape.
  // We preserve the `symbol` field — it tells the client which input character
  // was consumed to arrive at each trace step, which the visualizer uses to
  // highlight the current input position.
  const trace: SimulationStep[] = result.trace.map((step, i) => ({
    symbol: i === 0 ? null : input[i - 1] ?? null,
    states: step.states,
  }))

  return { accepted: result.accepted, trace }
}
