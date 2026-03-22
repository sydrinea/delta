import nfa from "./nfa";
import type { NFA } from "./nfa";
import { EPS, EPSILON } from "./constants";

/**
 * Automates listing of numerical states
 * @param lower the lower bound... i.e., q0
 * @param upper the upper bound... i.e., q15
 * @returns an array from [q0, ..., q15]
 */
export const q = (lower: number, upper: number) =>
  Array.from({ length: upper - lower + 1 }, (_, i) => `q${i + lower}`);

function renumber(machine: NFA, offset: number): Map<string, string> {
  const mapping = new Map<string, string>();
  [...machine.states].forEach((state, i) => {
    mapping.set(state, `q${offset + i}`);
  });
  return mapping;
}

function copyTransitions(
  builder: ReturnType<typeof nfa>,
  machine: NFA,
  mapping: Map<string, string>,
): void {
  for (const [from, symbolMap] of machine.transitions) {
    for (const [symbol, toSet] of symbolMap) {
      for (const to of toSet) {
        builder.transition(mapping.get(from)!, symbol, mapping.get(to)!);
      }
    }
  }
}

export function char(s: string): NFA {
  return nfa(`char_${s}`)
    .alphabet(s)
    .states("q0", "q1")
    .start("q0")
    .accept("q1")
    .transition("q0", s, "q1")
    .build();
}

export function epsilon(): NFA {
  return nfa(EPS)
    .states("q0", "q1")
    .start("q0")
    .accept("q1")
    .transition("q0", EPS, "q1")
    .build();
}

export function union(a: NFA, b: NFA): NFA {
  const mapA = renumber(a, 1);
  const mapB = renumber(b, 1 + a.states.size);
  const newStart = "q0";
  const newEnd = `q${a.states.size + b.states.size + 2}`;

  const builder = nfa(`${a.name}_union_${b.name}`)
    .alphabet(...a.alphabet, ...b.alphabet)
    .states(newStart, newEnd, ...[...mapA.values()], ...[...mapB.values()])
    .start(newStart)
    .accept(newEnd)
    .transition(newStart, EPSILON, mapA.get(a.startState)!)
    .transition(newStart, EPSILON, mapB.get(b.startState)!);

  copyTransitions(builder, a, mapA);
  copyTransitions(builder, b, mapB);

  const mappings = [mapA, mapB];
  for (const [index, acceptStates] of [a, b].map(
    (m, index) => [index, m.acceptStates] as const,
  )) {
    for (const acceptState of acceptStates) {
      builder.transition(mappings[index].get(acceptState)!, EPSILON, newEnd);
    }
  }

  return builder.build();
}

export function concat(a: NFA, b: NFA): NFA {
  const mapA = renumber(a, 0);
  const mapB = renumber(b, a.states.size);

  const builder = nfa(`${a.name}_concat_${b.name}`)
    .alphabet(...a.alphabet, ...b.alphabet)
    .states(...[...mapA.values()], ...[...mapB.values()])
    .start(mapA.get(a.startState)!)
    .accept(...[...b.acceptStates].map((s) => mapB.get(s)!));

  copyTransitions(builder, a, mapA);
  copyTransitions(builder, b, mapB);

  for (const acceptState of a.acceptStates) {
    builder.transition(
      mapA.get(acceptState)!,
      EPSILON,
      mapB.get(b.startState)!,
    );
  }

  return builder.build();
}

export function star(a: NFA): NFA {
  const mapA = renumber(a, 1);
  const newStart = "q0";
  const newEnd = `q${a.states.size + 1}`;

  const builder = nfa(`${a.name}_star`)
    .alphabet(...a.alphabet)
    .states(newStart, newEnd, ...[...mapA.values()])
    .start(newStart)
    .accept(newEnd)
    .transition(newStart, EPSILON, mapA.get(a.startState)!);

  copyTransitions(builder, a, mapA);

  for (const acceptState of a.acceptStates) {
    builder.transition(mapA.get(acceptState)!, EPSILON, newEnd);
  }

  const singleAcceptState = [...a.acceptStates][0];

  builder.transition(
    mapA.get(singleAcceptState)!,
    EPSILON,
    mapA.get(a.startState)!,
  );
  builder.transition(newStart, EPSILON, newEnd);

  return builder.build();
}
