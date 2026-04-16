import type { TuringMachine } from '@delta/build'
import type { FreeAdapter, SimulationOptions } from './core'
import { simulate as simulateGeneric } from './core'

/**
 * A full TM configuration: the current state, the position of each tape head,
 * and the contents of each tape (sparse — only non-blank cells are stored).
 *
 * The sparse `Map<number, string>` representation lets the tape grow in either
 * direction without pre-allocating anything. Missing entries read as blank.
 */
export interface TMConfiguration {
  state: string
  heads: number[]
  tapes: Map<number, string>[]
}

export interface SimulationStep {
  step: number
  states: Set<string>
  configurations: number
  /**
   * Human-readable tape readouts with the active head position bracketed,
   * e.g. `['0', '[1]', '0', '_']`. One array per tape.
   */
  tapes: string[][]
}

export interface SimulationResult {
  accepted: boolean
  halted: boolean
  exceededStepLimit: boolean
  trace: SimulationStep[]
}

export { type SimulationOptions }

function writeTapeSymbol(
  tape: Map<number, string>,
  index: number,
  symbol: string,
  blankSymbol: string,
): void {
  // Store only non-blank symbols to keep the tape sparse.
  if (symbol === blankSymbol) {
    tape.delete(index)
    return
  }
  tape.set(index, symbol)
}

function contentBounds(
  tape: Map<number, string>,
  blankSymbol: string,
): [number, number] | null {
  let min = Infinity
  let max = -Infinity

  for (const [index, symbol] of tape.entries()) {
    if (symbol !== blankSymbol) {
      if (index < min)
        min = index
      if (index > max)
        max = index
    }
  }

  return min <= max ? [min, max] : null
}

/**
 * Convert a sparse tape map to a flat string array for display.
 *
 * The head position is bracketed so the client can identify which cell is
 * currently being read. A padding of one cell on each side of the content
 * bounds ensures the display shows context around the written region.
 */
function tapeToReadout(
  tape: Map<number, string>,
  head: number,
  blankSymbol: string,
  padding = 1,
): string[] {
  const bounds = contentBounds(tape, blankSymbol)
  const [min, max] = bounds || [head, head]

  const start = Math.min(head, min - padding)
  const end = Math.max(head, max + padding)
  const out: string[] = []

  for (let index = start; index <= end; index += 1) {
    const symbol = tape.get(index) ?? blankSymbol
    out.push(index === head ? `[${symbol}]` : symbol)
  }

  return out
}

function tapesOf(config: TMConfiguration, blankSymbol: string): string[][] {
  return config.tapes.map((tape, index) =>
    tapeToReadout(tape, config.heads[index] ?? 0, blankSymbol),
  )
}

/**
 * Build a `FreeAdapter<TMConfiguration>` for a Turing Machine.
 *
 * TM simulation is free-step: the machine reads from its tape on each step
 * rather than consuming characters from an external input stream. There are no
 * epsilon transitions — each step either finds a valid transition and fires it,
 * or halts.
 *
 * Returning multiple successors from `freeStep` is what enables NDTM support:
 * for a standard (deterministic) TM there is at most one successor per step.
 * The core loop in `runFree` handles branching uniformly.
 */
function buildTMAdapter(machine: TuringMachine<any>): FreeAdapter<TMConfiguration> {
  return {
    mode: 'free',
    initial: [], // populated by the caller after initializing tape contents
    acceptStates: machine.acceptStates,
    epsilonStep: () => [],

    // Encode enough of the configuration to detect revisited states during
    // epsilon expansion. For TM the epsilon step is always empty so this key
    // is never actually used for deduplication, but the adapter interface
    // requires it for consistency.
    configKey: config =>
      `${config.state}|${config.heads.join(',')}|${JSON.stringify(
        config.tapes.map(t => [...t.entries()].sort((a, b) => a[0] - b[0])),
      )}`,

    getState: config => config.state,
    isAccepted: (config, acceptStates) => acceptStates.has(config.state),

    freeStep: (config) => {
      const readTuple = Array.from(
        { length: machine.tapeCount },
        (_, tapeIndex) =>
          config.tapes[tapeIndex]?.get(config.heads[tapeIndex] ?? 0)
          ?? machine.blankSymbol,
      )
      // The tuple key joins read symbols with the same separator used by the
      // TM builder when it stores transitions. Keeping the separator consistent
      // avoids mismatches between build and simulation.
      const tupleKey = readTuple.join('\u001F')
      const tupleTransition = machine.transitions.get(config.state)?.get(tupleKey)

      if (!tupleTransition) {
        // No transition defined for this (state, tape-read) combination —
        // this branch halts. Return [] so the core loop marks it as halted.
        return []
      }

      const nextTapes = config.tapes.map(t => new Map(t))
      const nextHeads = [...config.heads]

      tupleTransition.directions.forEach((direction: string, tapeIndex: number) => {
        const head = nextHeads[tapeIndex] ?? 0
        writeTapeSymbol(
          nextTapes[tapeIndex]!,
          head,
          tupleTransition.writeSymbols[tapeIndex] ?? readTuple[tapeIndex],
          machine.blankSymbol,
        )
        nextHeads[tapeIndex]
          = head + (direction === 'L' ? -1 : direction === 'R' ? 1 : 0)
      })

      return [{
        state: tupleTransition.toState,
        heads: nextHeads,
        tapes: nextTapes,
      }]
    },
  }
}

export { type SimulationOptions as TMSimulationOptions }

/**
 * Simulate a Turing Machine over `input` and return the accepted result with a
 * trace.
 *
 * The input is written onto tape 0 starting at cell 1 (cell 0 carries a blank
 * sentinel). All other tape cells start blank.
 *
 * Accepts nondeterministic TMs — `freeStep` may return multiple successors if
 * the machine's transition function is non-deterministic. For a standard DTM
 * each step has at most one successor and the behaviour is identical to the
 * original single-configuration loop.
 *
 * @example
 * const result = simulateTM(machine, '001100', { maxSteps: 5000 })
 * result.accepted          // true / false
 * result.halted            // true if the machine halted naturally
 * result.exceededStepLimit // true if cut short by maxSteps
 */
export function simulate(
  machine: TuringMachine<any>,
  input: string,
  options: SimulationOptions = {},
): SimulationResult {
  const tapeCount = machine.tapeCount

  // Initialize tapes: tape 0 gets the input, all other tapes start blank.
  const tapes = Array.from({ length: tapeCount }, () => new Map<number, string>())
  tapes[0]!.set(0, machine.blankSymbol)
  for (let i = 0; i < input.length; i++) {
    tapes[0]!.set(i + 1, input[i]!)
  }
  tapes[0]!.set(input.length + 1, machine.blankSymbol)

  const initialConfig: TMConfiguration = {
    state: machine.startState,
    heads: Array.from<number>({ length: tapeCount }).fill(0),
    tapes,
  }

  const adapter = buildTMAdapter(machine)
  adapter.initial = [initialConfig]

  const result = simulateGeneric(adapter, '', options)

  // Convert the generic SimulationStep<TMConfiguration> trace back to the
  // TM-specific shape. Tape readouts are computed here rather than inside the
  // core loop because tapeToReadout is a TM-specific concern.
  const trace: SimulationStep[] = result.trace.map((step, i) => ({
    step: i,
    states: step.states,
    configurations: step.configs.length,
    tapes: step.configs[0] ? tapesOf(step.configs[0], machine.blankSymbol) : [],
  }))

  return {
    accepted: result.accepted,
    halted: result.halted,
    exceededStepLimit: result.exceededStepLimit,
    trace,
  }
}
