import type { NFA } from './nfa'
import { EPSILON } from './constants'

/**
 * Compute the epsilon-closure of a set of NFA states.
 *
 * Returns the set of all states reachable from `states` by following zero
 * or more epsilon (ε) transitions. The original states are always included
 * in the result.
 *
 * This is the fundamental operation used by subset construction when
 * converting an NFA to a DFA.
 *
 * @param nfa - The NFA whose transition table to follow.
 * @param states - The initial set of states to expand.
 * @returns A new `Set` containing every state reachable via epsilon transitions
 *   from any state in `states`.
 *
 * @example
 * // If q0 --ε--> q1 --ε--> q2:
 * epsilonClosure(nfa, new Set(['q0'])) // Set { 'q0', 'q1', 'q2' }
 */
export function epsilonClosure(nfa: NFA, states: Set<string>): Set<string> {
  const closure = new Set(states)
  const queue = [...states]

  while (queue.length > 0) {
    const state = queue.pop()!
    const epsilonTargets
      = nfa.transitions.get(state)?.get(EPSILON) ?? new Set<string>()

    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target)
        queue.push(target)
      }
    }
  }

  return closure
}
