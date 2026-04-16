import type { PDA } from '@delta/build'
import type { SimulationOptions, StreamAdapter } from './core'
import { EPSILON } from '@delta/build'
import { simulate as simulateGeneric } from './core'

/**
 * A PDA configuration: the current state and the full stack contents.
 *
 * The stack is stored top-first — `stack[0]` is the top. This convention
 * matches the typical pen-and-paper notation for PDA derivations and makes
 * "peek" and "pop" operations a simple index-0 read/slice.
 */
export interface PDAConfiguration {
  state: string
  stack: string[]
}

export interface PDASimulationStep {
  states: Set<string>
  /**
   * All active configurations at this step. Exposed so the client can
   * visualize the stack contents alongside the state graph.
   */
  configurations: PDAConfiguration[]
}

export interface PDASimulationResult {
  accepted: boolean
  exceededStepLimit: boolean
  trace: PDASimulationStep[]
}

/**
 * Apply a single PDA transition to a configuration.
 *
 * Returns `null` if the transition's pop symbol doesn't match the current
 * stack top (or if the stack is empty when a non-epsilon pop is required).
 *
 * The pop/push are applied atomically: we pop `stackPop`, then push
 * `stackPush` in order so that the first element of `stackPush` ends up on
 * top — matching the `push: top-to-bottom` convention in `PDATransition`.
 */
function applyTransition(
  config: PDAConfiguration,
  inputSymbol: string,
  stackPop: string,
  stackPush: string[],
  toState: string,
): PDAConfiguration | null {
  const stackTop = config.stack[0] ?? null

  // Epsilon pop means "don't check the stack top" — we skip the pop step.
  const popOk = stackPop === EPSILON || stackTop === stackPop
  if (!popOk)
    return null

  const stackAfterPop = stackPop === EPSILON ? config.stack : config.stack.slice(1)
  return {
    state: toState,
    stack: [...stackPush, ...stackAfterPop],
  }
}

/**
 * Collect all configurations reachable in one step from `config` on `input`.
 *
 * Looks up `transitions.get(state)` and tries every entry whose `inputSymbol`
 * matches `input`. Each matching transition is applied via `applyTransition`,
 * which validates the stack pop and constructs the successor configuration.
 *
 * We iterate the full transition map for the state rather than using a direct
 * key lookup because `input` alone doesn't determine the transition — the
 * stack top is the second half of the key, and we need to try every
 * `(input, *)` combination to find all valid moves.
 */
function successorsFor(
  config: PDAConfiguration,
  pda: PDA,
  input: string,
): PDAConfiguration[] {
  const stateTransitions = pda.transitions.get(config.state)
  if (!stateTransitions)
    return []

  const results: PDAConfiguration[] = []
  for (const t of stateTransitions.values()) {
    if (t.inputSymbol !== input)
      continue
    const next = applyTransition(config, input, t.stackPop, t.stackPush, t.toState)
    if (next !== null)
      results.push(next)
  }
  return results
}

/**
 * Build a `StreamAdapter<PDAConfiguration>` for a PDA.
 *
 * PDA is fundamentally an NFA with a stack: it processes input as a stream of
 * symbols and may branch non-deterministically. The epsilon step handles
 * ε-input transitions (which consume no input but may pop/push the stack), and
 * the symbol step handles regular transitions.
 *
 * Configuration keys encode both state and stack so that the epsilon-closure
 * deduplication in `core.ts` can detect cycles correctly. Without stack
 * encoding, a PDA that epsilon-cycles through the same state with different
 * stacks would appear to revisit a "seen" config and halt early.
 */
function buildPDAAdapter(pda: PDA): StreamAdapter<PDAConfiguration> {
  return {
    mode: 'stream',
    initial: [{ state: pda.startState, stack: [pda.initialStackSymbol] }],
    acceptStates: pda.acceptStates,

    // Encode state + full stack so cycles with different stack contents are
    // treated as distinct configurations during epsilon expansion.
    configKey: config => `${config.state}|${config.stack.join(',')}`,

    getState: config => config.state,
    isAccepted: (config, acceptStates) => acceptStates.has(config.state),

    // Follow ε-input transitions without consuming any input.
    epsilonStep: config => successorsFor(config, pda, EPSILON),

    symbolStep: (config, symbol) => successorsFor(config, pda, symbol),
  }
}

/**
 * Simulate a PDA over `input` and return the accepted result with a trace.
 *
 * Acceptance is by final state: the machine accepts if any active
 * configuration is in an accept state after the full input has been consumed
 * (and all reachable epsilon transitions have been followed).
 *
 * @example
 * // aⁿbⁿ PDA
 * const result = simulatePDA(machine, 'aaabbb')
 * result.accepted               // true
 * result.trace[0].configurations // [{ state: 'q0', stack: ['Z'] }]
 */
export function simulatePDA(
  pda: PDA,
  input: string,
  options: SimulationOptions = {},
): PDASimulationResult {
  const adapter = buildPDAAdapter(pda)
  const result = simulateGeneric(adapter, input, options)

  const trace: PDASimulationStep[] = result.trace.map(step => ({
    states: step.states,
    configurations: step.configs,
  }))

  return {
    accepted: result.accepted,
    exceededStepLimit: result.exceededStepLimit,
    trace,
  }
}
