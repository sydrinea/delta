import type { NFA } from './nfa'
import { EPS, EPSILON } from './constants'
import nfa from './nfa'

/**
 * Generate a list of numbered state names in the format `q<n>`.
 *
 * A convenience for `states(...q(0, 4))` instead of typing out
 * `states('q0', 'q1', 'q2', 'q3', 'q4')` manually.
 *
 * @param lower - The first index (inclusive), e.g. `0` produces `'q0'`.
 * @param upper - The last index (inclusive), e.g. `4` produces `'q4'`.
 * @returns An array `['q{lower}', ..., 'q{upper}']`.
 *
 * @example
 * q(0, 3) // ['q0', 'q1', 'q2', 'q3']
 * nfa('example').states(...q(0, 5))
 */
export function q(lower: number, upper: number) {
  return Array.from({ length: upper - lower + 1 }, (_, i) => `q${i + lower}`)
}

function renumber(machine: NFA, offset: number): Map<string, string> {
  const mapping = new Map<string, string>();
  [...machine.states].forEach((state, i) => {
    mapping.set(state, `q${offset + i}`)
  })
  return mapping
}

function copyTransitions(
  builder: ReturnType<typeof nfa>,
  machine: NFA,
  mapping: Map<string, string>,
): void {
  for (const [from, symbolMap] of machine.transitions) {
    for (const [symbol, toSet] of symbolMap) {
      for (const to of toSet) {
        builder.transition(mapping.get(from)!, symbol, mapping.get(to)!)
      }
    }
  }
}

/**
 * Build a two-state NFA that accepts exactly the single character `s`.
 *
 * Produces the machine `q0 --s--> q1` with `q0` as start and `q1` as accept.
 * Primarily used as a building block for Thompson construction.
 *
 * @param s - The single character to match.
 * @returns An `NFA` accepting only the one-character string `s`.
 *
 * @example
 * const a = char('a') // accepts only "a"
 */
export function char(s: string): NFA {
  return nfa(`char_${s}`)
    .alphabet(s)
    .states('q0', 'q1')
    .start('q0')
    .accept('q1')
    .transition('q0', s, 'q1')
    .build()
}

/**
 * Build a two-state NFA that accepts the empty string (ε).
 *
 * Produces `q0 --ε--> q1`. Used as a building block when composing NFAs
 * with Thompson construction.
 *
 * @returns An `NFA` that accepts only the empty string.
 *
 * @example
 * const eps = epsilon() // accepts ""
 */
export function epsilon(): NFA {
  return nfa(EPS)
    .states('q0', 'q1')
    .start('q0')
    .accept('q1')
    .transition('q0', EPS, 'q1')
    .build()
}

/**
 * Build an NFA that accepts the **union** (alternation) of two languages: `a | b`.
 *
 * Uses the standard Thompson construction: introduces a new start state with
 * epsilon transitions to the start states of both machines, and a new accept
 * state reached from all accept states of both machines via epsilon transitions.
 *
 * @param a - First NFA.
 * @param b - Second NFA.
 * @returns A new `NFA` accepting any string accepted by `a` or `b`.
 *
 * @example
 * const aOrB = union(char('a'), char('b')) // accepts "a" or "b"
 */
export function union(a: NFA, b: NFA): NFA {
  const mapA = renumber(a, 1)
  const mapB = renumber(b, 1 + a.states.size)
  const newStart = 'q0'
  const newEnd = `q${a.states.size + b.states.size + 2}`

  const builder = nfa(`${a.name}_union_${b.name}`)
    .alphabet(...a.alphabet, ...b.alphabet)
    .states(newStart, newEnd, ...[...mapA.values()], ...[...mapB.values()])
    .start(newStart)
    .accept(newEnd)
    .transition(newStart, EPSILON, mapA.get(a.startState)!)
    .transition(newStart, EPSILON, mapB.get(b.startState)!)

  copyTransitions(builder, a, mapA)
  copyTransitions(builder, b, mapB)

  const mappings = [mapA, mapB]
  for (const [index, acceptStates] of [a, b].map(
    (m, index) => [index, m.acceptStates] as const,
  )) {
    for (const acceptState of acceptStates) {
      builder.transition(mappings[index].get(acceptState)!, EPSILON, newEnd)
    }
  }

  return builder.build()
}

/**
 * Build an NFA that accepts the **concatenation** of two languages: `ab`.
 *
 * Connects the accept states of `a` to the start state of `b` via epsilon
 * transitions, forming a single machine that first processes `a`, then `b`.
 *
 * @param a - The first (prefix) NFA.
 * @param b - The second (suffix) NFA.
 * @returns A new `NFA` accepting strings of the form `xy` where `x` is in
 *   the language of `a` and `y` is in the language of `b`.
 *
 * @example
 * const ab = concat(char('a'), char('b')) // accepts only "ab"
 */
export function concat(a: NFA, b: NFA): NFA {
  const mapA = renumber(a, 0)
  const mapB = renumber(b, a.states.size)

  const builder = nfa(`${a.name}_concat_${b.name}`)
    .alphabet(...a.alphabet, ...b.alphabet)
    .states(...[...mapA.values()], ...[...mapB.values()])
    .start(mapA.get(a.startState)!)
    .accept(...Array.from(b.acceptStates, s => mapB.get(s)!))

  copyTransitions(builder, a, mapA)
  copyTransitions(builder, b, mapB)

  for (const acceptState of a.acceptStates) {
    builder.transition(
      mapA.get(acceptState)!,
      EPSILON,
      mapB.get(b.startState)!,
    )
  }

  return builder.build()
}

/**
 * Build an NFA that accepts the **Kleene star** of a language: `a*`.
 *
 * Wraps `a` in the standard Thompson construction: new start and accept states
 * with epsilon transitions allowing zero repetitions, and a back-edge from
 * the accept states of `a` to its own start state enabling multiple passes.
 *
 * @param a - The NFA whose language will be repeated.
 * @returns A new `NFA` accepting zero or more repetitions of any string in
 *   the language of `a`, including the empty string.
 *
 * @example
 * const astar = star(char('a')) // accepts "", "a", "aa", "aaa", …
 */
export function star(a: NFA): NFA {
  const mapA = renumber(a, 1)
  const newStart = 'q0'
  const newEnd = `q${a.states.size + 1}`

  const builder = nfa(`${a.name}_star`)
    .alphabet(...a.alphabet)
    .states(newStart, newEnd, ...[...mapA.values()])
    .start(newStart)
    .accept(newEnd)
    .transition(newStart, EPSILON, mapA.get(a.startState)!)

  copyTransitions(builder, a, mapA)

  for (const acceptState of a.acceptStates) {
    builder.transition(mapA.get(acceptState)!, EPSILON, newEnd)
  }

  const singleAcceptState = [...a.acceptStates][0]

  builder.transition(
    mapA.get(singleAcceptState)!,
    EPSILON,
    mapA.get(a.startState)!,
  )
  builder.transition(newStart, EPSILON, newEnd)

  return builder.build()
}
