import { EPSILON, type NFA } from "@delta/build";

export function epsilonClosure(nfa: NFA, states: Set<string>): Set<string> {
  const closure = new Set(states);
  const queue = [...states];
  while (queue.length > 0) {
    const state = queue.pop()!;
    const epsilonTargets =
      nfa.transitions.get(state)?.get(EPSILON) ?? new Set();
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        queue.push(target);
      }
    }
  }
  return closure;
}
