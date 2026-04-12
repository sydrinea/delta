import type { NFA } from './nfa'
import { EPSILON } from './constants'
import { NFABuilder, NFABuildError, NFAMessages } from './nfa'

/**
 * Everything that may fail when constructing the DFA
 * A DFA is an NFA with additional constraints
 */
export const DFAMessages = {
  ...NFAMessages,
  missingTransition: (state: string, symbol: string) =>
    `DFA state '${state}' must have exactly one transition for symbol '${symbol}'`,
  nondeterministicTransition: (from: string, symbol: string) =>
    `DFA transition from '${from}' on '${symbol}' is nondeterministic`,
  epsilonTransitionNotAllowed: 'DFA transitions cannot use epsilon',
} as const

/**
 * Builder for a Deterministic Finite Automaton (DFA).
 *
 * Extends `NFABuilder` with two extra constraints enforced at build time:
 * - Epsilon transitions are **not** allowed.
 * - Every (state, symbol) pair must have **exactly one** transition
 *   (missing transitions are errors, not just warnings).
 *
 * Use the top-level `dfa(name)` factory instead of constructing this directly.
 */
class DFABuilder extends NFABuilder {
  public override transition(from: string, symbol: string, to: string): this {
    // (1) we disallow epsilon transitions
    if (symbol === EPSILON) {
      this.message('error', DFAMessages.epsilonTransitionNotAllowed)
      return this
    }

    // (2) we don't allow nondeterminism
    const existing = this._transitions.get(from)?.get(symbol)
    if (existing !== undefined && existing.size > 0) {
      this.message(
        'error',
        DFAMessages.nondeterministicTransition(from, symbol),
      )
      return this
    }
    return super.transition(from, symbol, to)
  }

  public override build(): NFA {
    if (this._built)
      throw new Error(DFAMessages.alreadyBuilt)
    this._built = true

    if (!this._startState) {
      this.message('error', DFAMessages.noStartState)
    }

    for (const [state, symbolMap] of this._transitions) {
      for (const symbol of this._alphabet) {
        if (!symbolMap.has(symbol)) {
          this.message('error', DFAMessages.missingTransition(state, symbol))
        }
      }
    }

    this.throwIfAnyErrors(() => new NFABuildError(this._messages))

    return {
      name: this._name,
      alphabet: this._alphabet,
      states: this._states,
      startState: this._startState!,
      acceptStates: this._acceptStates,
      transitions: this._transitions,
      messages: this._messages,
    }
  }
}

/**
 * Create a new DFA (Deterministic Finite Automaton) builder.
 *
 * Identical API to `nfa()`, but `build()` enforces DFA constraints:
 * every state must have exactly one transition per alphabet symbol, and
 * epsilon transitions are forbidden.
 *
 * @param name - A label for the automaton, used in debug output.
 * @returns A fresh `DFABuilder`.
 *
 * @example
 * // DFA that accepts strings over {0, 1} with an even number of 0s
 * const machine = dfa('even-zeros')
 *   .alphabet('0', '1')
 *   .states('q0', 'q1')
 *   .start('q0').accept('q0')
 *   .transition('q0', '0', 'q1')
 *   .transition('q0', '1', 'q0')
 *   .transition('q1', '0', 'q0')
 *   .transition('q1', '1', 'q1')
 *   .build()
 */
export default function dfa(name: string): DFABuilder {
  return new DFABuilder(name)
}
