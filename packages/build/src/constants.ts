/**
 * The empty (epsilon) transition symbol — `ε`.
 *
 * Use this as the `symbol` argument of `transition()` to add an
 * epsilon-transition that the machine can follow without consuming any input.
 *
 * @example
 * nfa('example')
 *   .states('q0', 'q1')
 *   .transition('q0', EPSILON, 'q1') // free move from q0 to q1
 */
export const EPSILON = 'ε' as const

/**
 * Shorthand alias for `EPSILON` (`ε`).
 *
 * Both `EPS` and `EPSILON` refer to the same symbol and can be used
 * interchangeably anywhere an epsilon transition is needed.
 *
 * @example
 * .transition('q0', EPS, 'q1')
 */
export const EPS = EPSILON
