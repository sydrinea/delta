/**
 * Generic non-deterministic machine simulation.
 *
 * NFA, PDA, and TM all share the same fundamental simulation loop: maintain a
 * set of current configurations, expand epsilon transitions to fixpoint, then
 * advance. What differs between machine families is:
 *
 *   - How a "step" is triggered (consuming an input symbol vs. an autonomous
 *     tape-read), and
 *   - What a "configuration" holds (a bare state string, a state+stack pair,
 *     or a full tape snapshot).
 *
 * `SimulationAdapter<C>` captures those machine-specific details so that the
 * core loop here stays generic. The two modes are:
 *
 *   - `'stream'` (NFA, PDA): the outer loop iterates over input characters.
 *     `symbolStep` is called for each character, then epsilon transitions are
 *     expanded to fixpoint.
 *
 *   - `'free'` (TM, NDTM): the outer loop runs autonomously until all
 *     configurations have halted or the step limit is exceeded.
 *     `freeStep` fires on every iteration without consuming input.
 */

/** A single snapshot in the simulation trace. */
export interface SimulationStep<C> {
  /**
   * The set of state names occupied at this step — used by the visualizer to
   * highlight active nodes in the graph.
   */
  states: Set<string>
  /**
   * The full configurations at this step. For NFA `C = string` so this
   * duplicates `states`; for PDA and TM the configs carry additional context
   * (stack or tape) needed for richer visualization.
   */
  configs: C[]
}

/** The outcome of a complete simulation run. */
export interface SimulationResult<C> {
  accepted: boolean
  trace: SimulationStep<C>[]
  /**
   * `true` when the machine halted because no configuration had a valid
   * successor — meaningful for free-step machines (TM). Always `false` for
   * stream machines (NFA, PDA), which terminate by exhausting their input.
   */
  halted: boolean
  /**
   * `true` when the run was cut short by `SimulationOptions.maxSteps`.
   * The caller should treat the result as inconclusive rather than rejected.
   */
  exceededStepLimit: boolean
}

/** Options that apply to any simulation, regardless of machine type. */
export interface SimulationOptions {
  /**
   * Maximum number of steps before the simulation is aborted.
   *
   * For stream machines this limits input consumption steps; for free-step
   * machines it limits autonomous transitions. Defaults to 10,000.
   */
  maxSteps?: number
  /**
   * Maximum number of configurations allowed in the epsilon-closure at any
   * single expansion. Guards against epsilon cycles that grow the
   * configuration space unboundedly (e.g., a PDA that epsilon-pushes onto the
   * stack in a loop). Defaults to 1,000.
   */
  maxConfigurations?: number
}

interface BaseAdapter<C> {
  /** The configurations the machine starts in before any epsilon expansion. */
  initial: C[]
  /**
   * Return the immediate epsilon-transition successors of `config`.
   *
   * The core loop calls this iteratively to reach the epsilon-closure fixpoint
   * — each call should return only the *direct* successors, not the full
   * transitive closure.
   *
   * Return `[]` for machines without epsilon transitions (TM).
   */
  epsilonStep: (config: C) => C[]
  /**
   * A stable string key that uniquely identifies a configuration.
   *
   * Used during epsilon expansion to detect already-visited configurations and
   * break cycles. For NFA (C = string) this is the identity; for PDA it
   * encodes state + stack contents; for TM it encodes state + heads + tape.
   */
  configKey: (config: C) => string
  /** Extract the state name from a configuration — used to populate `SimulationStep.states`. */
  getState: (config: C) => string
  /** Return `true` if this configuration should be counted as accepting. */
  isAccepted: (config: C, acceptStates: Set<string>) => boolean
  acceptStates: Set<string>
}

/**
 * Adapter for machines that process input as a stream of symbols (NFA, PDA).
 *
 * The outer loop calls `symbolStep` once per input character, then expands
 * epsilon transitions to fixpoint.
 */
export interface StreamAdapter<C> extends BaseAdapter<C> {
  mode: 'stream'
  symbolStep: (config: C, symbol: string) => C[]
}

/**
 * Adapter for machines that advance autonomously without consuming input
 * character-by-character (TM, NDTM).
 *
 * The input string is used only to initialize the machine (e.g., write it onto
 * tape 0). The outer loop then calls `freeStep` repeatedly until all
 * configurations have halted or the step limit is hit.
 */
export interface FreeAdapter<C> extends BaseAdapter<C> {
  mode: 'free'
  freeStep: (config: C) => C[]
}

export type SimulationAdapter<C> = StreamAdapter<C> | FreeAdapter<C>

const DEFAULT_MAX_STEPS = 10_000
const DEFAULT_MAX_CONFIGURATIONS = 1_000

/**
 * Remove duplicate configurations by their `configKey` and enforce the
 * `maxConfigurations` cap.
 *
 * Deduplication is necessary in the epsilon-closure loop: without it, a PDA
 * epsilon cycle would re-enqueue the same configuration endlessly. The cap
 * provides a safety valve for cases where the configuration space grows
 * unboundedly (e.g., a PDA that epsilon-pushes unconditionally).
 */
function dedup<C>(configs: C[], adapter: BaseAdapter<C>, maxConfigs: number): C[] {
  const seen = new Set<string>()
  const result: C[] = []
  for (const config of configs) {
    if (result.length >= maxConfigs)
      break
    const key = adapter.configKey(config)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(config)
    }
  }
  return result
}

/**
 * Expand `configs` to the epsilon-closure fixpoint.
 *
 * Iteratively calls `adapter.epsilonStep` on each newly discovered
 * configuration until no new configurations are found. The BFS queue ensures
 * every reachable epsilon-successor is visited exactly once — the `seen` set
 * (keyed by `configKey`) prevents revisiting.
 */
function epsilonExpand<C>(
  configs: C[],
  adapter: BaseAdapter<C>,
  maxConfigs: number,
): C[] {
  const seen = new Set<string>(configs.map(c => adapter.configKey(c)))
  const result = [...configs]
  const queue = [...configs]

  while (queue.length > 0 && result.length < maxConfigs) {
    const config = queue.pop()!
    for (const next of adapter.epsilonStep(config)) {
      const key = adapter.configKey(next)
      if (!seen.has(key)) {
        seen.add(key)
        result.push(next)
        queue.push(next)
      }
    }
  }

  return result
}

/** Collect the unique state names from a list of configurations. */
function configsToStates<C>(configs: C[], adapter: BaseAdapter<C>): Set<string> {
  return new Set(configs.map(c => adapter.getState(c)))
}

/**
 * Simulate a machine over `input` using the provided adapter.
 *
 * The function is intentionally internal to this package — machine-specific
 * modules (`nfa.ts`, `pda.ts`, `tm.ts`) wrap it and expose typed public APIs.
 */
export function simulate<C>(
  adapter: SimulationAdapter<C>,
  input: string,
  options: SimulationOptions = {},
): SimulationResult<C> {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS
  const maxConfigs = options.maxConfigurations ?? DEFAULT_MAX_CONFIGURATIONS

  // Expand epsilon transitions from the initial configurations before
  // consuming any input — the machine may be able to reach additional states
  // without reading a single character.
  const current = epsilonExpand(adapter.initial, adapter, maxConfigs)
  const trace: SimulationStep<C>[] = [
    { states: configsToStates(current, adapter), configs: current },
  ]

  if (adapter.mode === 'stream') {
    return runStream(adapter, current, trace, input, maxConfigs)
  }
  else {
    return runFree(adapter, current, trace, maxSteps, maxConfigs)
  }
}

/**
 * Stream-mode simulation loop (NFA, PDA).
 *
 * Consumes the input one character at a time. For each character we apply
 * `symbolStep` to every current configuration, collect all successors, then
 * expand epsilon transitions to fixpoint before moving to the next character.
 */
function runStream<C>(
  adapter: StreamAdapter<C>,
  initial: C[],
  trace: SimulationStep<C>[],
  input: string,
  maxConfigs: number,
): SimulationResult<C> {
  let current = initial

  for (const symbol of input) {
    // Short-circuit: if no configurations remain the machine is already dead.
    if (current.length === 0)
      break

    const afterSymbol = dedup(
      current.flatMap(c => adapter.symbolStep(c, symbol)),
      adapter,
      maxConfigs,
    )
    current = epsilonExpand(afterSymbol, adapter, maxConfigs)
    trace.push({ states: configsToStates(current, adapter), configs: current })
  }

  const accepted = current.some(c => adapter.isAccepted(c, adapter.acceptStates))
  return { accepted, trace, halted: false, exceededStepLimit: false }
}

/**
 * Free-step simulation loop (TM, NDTM).
 *
 * Advances all current configurations autonomously until every branch has
 * halted (no successors), an accepting configuration is found among the halted
 * branches, or the step limit is exceeded.
 *
 * For a deterministic TM, `freeStep` returns at most one successor, so
 * `current` always has at most one entry — behaviour is identical to the
 * original single-configuration loop. Returning multiple successors per step
 * is what gives NDTM support for free.
 */
function runFree<C>(
  adapter: FreeAdapter<C>,
  initial: C[],
  trace: SimulationStep<C>[],
  maxSteps: number,
  maxConfigs: number,
): SimulationResult<C> {
  let current = initial

  for (let step = 0; step < maxSteps; step++) {
    const continuing: C[] = []
    const halted: C[] = []

    for (const config of current) {
      const successors = adapter.freeStep(config)
      if (successors.length === 0) {
        // This branch has no valid transition — it has halted.
        halted.push(config)
      }
      else {
        continuing.push(...successors)
      }
    }

    // Eagerly accept: if any halted branch is in an accept state, we're done.
    // We don't need to wait for all branches to halt.
    if (halted.some(c => adapter.isAccepted(c, adapter.acceptStates))) {
      // Add the halted configs to the trace so the visualizer can show the
      // final accepting state before returning.
      const finalConfigs = [...halted, ...continuing]
      trace.push({ states: configsToStates(finalConfigs, adapter), configs: finalConfigs })
      return { accepted: true, trace, halted: true, exceededStepLimit: false }
    }

    if (continuing.length === 0) {
      // All branches halted and none are accepting — reject.
      return { accepted: false, trace, halted: true, exceededStepLimit: false }
    }

    current = dedup(epsilonExpand(continuing, adapter, maxConfigs), adapter, maxConfigs)
    trace.push({ states: configsToStates(current, adapter), configs: current })
  }

  return { accepted: false, trace, halted: false, exceededStepLimit: true }
}
