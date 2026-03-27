import { type NFA } from "@delta/build";
import { epsilonClosure } from "../../transform/src/utils";

export interface SimulationStep {
  symbol: string | null;
  states: Set<string>;
}

export interface SimulationResult {
  accepted: boolean;
  trace: SimulationStep[];
}

export function simulate(nfa: NFA, input: string): SimulationResult {
  const trace: SimulationStep[] = [];
  let current = epsilonClosure(nfa, new Set([nfa.startState]));
  trace.push({ symbol: null, states: new Set(current) });

  for (const symbol of input) {
    const next = new Set<string>();
    for (const state of current) {
      for (const target of nfa.transitions.get(state)?.get(symbol) ?? []) {
        next.add(target);
      }
    }
    current = epsilonClosure(nfa, next);
    trace.push({ symbol, states: new Set(current) });
  }

  const accepted = [...current].some((s) => nfa.acceptStates.has(s));
  return { accepted, trace };
}
