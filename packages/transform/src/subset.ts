import type { Message, NFA } from '@delta/build'
import { epsilonClosure } from './utils'

function stateName(preserve: boolean): (states: Set<string>) => string {
  let stateNum = 0
  return (states: Set<string>) => {
    if (!preserve)
      return `q${stateNum++}`
    const sorted = [...states].sort()
    return `{${sorted.join(',')}}`
  }
}

/**
 * Options for the NFA-to-DFA conversion.
 */
interface ConvertOptions {
  /**
   * Name to assign to the resulting DFA.
   * Defaults to `"<nfa-name>__dfa"`.
   */
  name?: string
  /**
   * When `true` (the default), DFA state names reflect the NFA subsets they
   * represent — e.g. `{q0,q1}`. When `false`, states are named `q0`, `q1`,
   * … in the order they are discovered, which produces shorter names but
   * makes the structure harder to relate back to the original NFA.
   */
  preserveNames?: boolean
}

/**
 * Convert an NFA to an equivalent DFA using the subset (powerset) construction.
 *
 * Every state in the resulting DFA corresponds to a set of NFA states, and
 * epsilon-closures are computed at each step. The output is a valid `NFA`
 * object (structurally identical to `DFA` output) with no epsilon transitions
 * and exactly one transition per (state, symbol) pair.
 *
 * @param nfa - The NFA to convert.
 * @param options - Optional name and naming strategy for the output DFA.
 * @returns An `NFA` value that is also a valid DFA.
 *
 * @example
 * import { nfa } from '@delta/build'
 * import { convertToDFA } from '@delta/transform'
 *
 * const myNFA = nfa('example')
 *   .alphabet('a', 'b')
 *   // ... states and transitions ...
 *   .build()
 *
 * const dfa = convertToDFA(myNFA)
 * // or with options:
 * const dfa2 = convertToDFA(myNFA, { name: 'my-dfa', preserveNames: false })
 */
export function convertToDFA(nfa: NFA, options: ConvertOptions = {}): NFA {
  const { name = `${nfa.name}__dfa`, preserveNames = true } = options
  const subsetToName = new Map<string, string>()
  const nextStateName = stateName(preserveNames)

  const getDfaName = (states: Set<string>) => {
    const key = [...states].sort().join(',')
    if (!subsetToName.has(key)) {
      subsetToName.set(key, nextStateName(states))
    }
    return subsetToName.get(key)!
  }

  const initialStates = epsilonClosure(nfa, new Set([nfa.startState]))
  const initialName = getDfaName(initialStates)

  const dfaStates = new Map<string, Set<string>>()
  const dfaTransitions = new Map<string, Map<string, Set<string>>>()
  const worklist: Set<string>[] = [initialStates]

  dfaStates.set(initialName, initialStates)

  while (worklist.length > 0) {
    const current = worklist.pop()!
    const currentName = getDfaName(current)

    if (!dfaTransitions.has(currentName)) {
      dfaTransitions.set(currentName, new Map())
    }

    for (const symbol of nfa.alphabet) {
      const next = new Set<string>()
      for (const nfaState of current) {
        for (const target of nfa.transitions.get(nfaState)?.get(symbol) ?? []) {
          next.add(target)
        }
      }

      const closed = epsilonClosure(nfa, next)
      const nextName = getDfaName(closed)

      dfaTransitions.get(currentName)!.set(symbol, new Set([nextName]))

      if (!dfaStates.has(nextName)) {
        dfaStates.set(nextName, closed)
        worklist.push(closed)
      }
    }
  }

  const dfaAcceptStates = new Set(
    [...dfaStates.keys()].filter((name) => {
      const nfaStates = dfaStates.get(name)!
      return [...nfaStates].some(s => nfa.acceptStates.has(s))
    }),
  )

  const messages: Message[] = []

  return {
    name,
    alphabet: nfa.alphabet,
    states: new Set(dfaStates.keys()),
    startState: initialName,
    acceptStates: dfaAcceptStates,
    transitions: dfaTransitions,
    messages,
  }
}
