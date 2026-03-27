import { type TuringMachine } from "@delta/build";

interface TapeTransition {
  toState: string;
  writeSymbol: string;
  direction: "L" | "R" | "S";
}

export interface TMConfiguration {
  state: string;
  heads: number[];
  tapes: Map<number, string>[];
}

export interface SimulationStep {
  step: number;
  states: Set<string>;
  configurations: number;
  tapes: string[][];
}

export interface SimulationResult {
  accepted: boolean;
  halted: boolean;
  exceededStepLimit: boolean;
  trace: SimulationStep[];
}

export interface SimulationOptions {
  maxSteps?: number;
  maxConfigurations?: number;
}

const DEFAULT_MAX_STEPS = 10_000;

function writeTapeSymbol(
  tape: Map<number, string>,
  index: number,
  symbol: string,
  blankSymbol: string,
): void {
  if (symbol === blankSymbol) {
    tape.delete(index);
    return;
  }
  tape.set(index, symbol);
}

function applyMultiTapeTransition(
  config: TMConfiguration,
  transitions: TapeTransition[],
  blankSymbol: string,
): TMConfiguration {
  const nextTapes = config.tapes.map((t) => new Map(t));
  const nextHeads = [...config.heads];

  transitions.forEach((transition, tapeIndex) => {
    const head = nextHeads[tapeIndex] ?? 0;
    const tape = nextTapes[tapeIndex] ?? new Map<number, string>();
    writeTapeSymbol(tape, head, transition.writeSymbol, blankSymbol);

    nextHeads[tapeIndex] =
      head +
      (transition.direction === "L"
        ? -1
        : transition.direction === "R"
          ? 1
          : 0);

    nextTapes[tapeIndex] = tape;
  });

  return {
    state: transitions[0]?.toState ?? config.state,
    heads: nextHeads,
    tapes: nextTapes,
  };
}

function resolveMultiTapeStep(
  machine: TuringMachine<any>,
  config: TMConfiguration,
  blankSymbol: string,
): TapeTransition[] | null {
  const readTuple = [...Array(machine.tapeCount).keys()].map(
    (tapeIndex) =>
      config.tapes[tapeIndex]?.get(config.heads[tapeIndex] ?? 0) ?? blankSymbol,
  );
  const tupleKey = readTuple.join("\u001F");
  const stateTuples = machine.transitions.get(config.state);
  const tupleTransition = stateTuples?.get(tupleKey);
  if (!tupleTransition) {
    return null;
  }

  return tupleTransition.directions.map((direction, tapeIndex) => ({
    toState: tupleTransition.toState,
    writeSymbol:
      tupleTransition.writeSymbols[tapeIndex] ?? readTuple[tapeIndex],
    direction,
  }));
}

function contentBounds(
  tape: Map<number, string>,
  blankSymbol: string,
): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;

  for (const [index, symbol] of tape.entries()) {
    if (symbol !== blankSymbol) {
      if (index < min) {
        min = index;
      }
      if (index > max) {
        max = index;
      }
    }
  }

  return min <= max ? [min, max] : null;
}

function tapeToReadout(
  tape: Map<number, string>,
  head: number,
  blankSymbol: string,
  padding = 1,
): string[] {
  const bounds = contentBounds(tape, blankSymbol);
  const [min, max] = bounds ? bounds : [head, head];

  const start = Math.min(head, min - padding);
  const end = Math.max(head, max + padding);
  const out: string[] = [];

  for (let index = start; index <= end; index += 1) {
    const symbol = tape.get(index) ?? blankSymbol;
    out.push(index === head ? `[${symbol}]` : symbol);
  }

  return out;
}

function tapesOf(config: TMConfiguration, blankSymbol: string): string[][] {
  return config.tapes.map((tape, index) =>
    tapeToReadout(tape, config.heads[index] ?? 0, blankSymbol),
  );
}

export function formatTrace(trace: SimulationStep[]): string {
  return trace
    .map((step) => {
      const states = [...step.states].sort().join(", ") || "(none)";
      const header = `step ${step.step} | states: ${states} | configurations: ${step.configurations}`;
      const tapes = step.tapes.map(
        (tape, i) => `  ${i + 1}. ${tape.join(" ")}`,
      );
      return [header, ...tapes].join("\n");
    })
    .join("\n\n");
}

export function simulate(
  machine: TuringMachine<any>,
  input: string,
  options: SimulationOptions = {},
): SimulationResult {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;

  const tapeCount = machine.tapeCount;
  const tapes = [...Array(tapeCount).keys()].map(() => {
    const tape = new Map<number, string>();
    tape.set(0, machine.blankSymbol);
    tape.set(1, machine.blankSymbol);
    return tape;
  });

  for (let i = 0; i < input.length; i += 1) {
    tapes[0]?.set(i + 1, input[i]);
  }
  tapes[0]?.set(input.length + 1, machine.blankSymbol);

  const initial: TMConfiguration = {
    state: machine.startState,
    heads: [...Array(tapeCount).keys()].map(() => 0),
    tapes,
  };

  const trace: SimulationStep[] = [
    {
      step: 0,
      states: new Set([initial.state]),
      configurations: 1,
      tapes: tapesOf(initial, machine.blankSymbol),
    },
  ];

  let current = initial;
  for (let step = 0; step < maxSteps; step += 1) {
    const transitions = resolveMultiTapeStep(
      machine,
      current,
      machine.blankSymbol,
    );

    if (!transitions || transitions.length === 0) {
      return {
        accepted: machine.acceptStates.has(current.state),
        halted: true,
        exceededStepLimit: false,
        trace,
      };
    }

    current = applyMultiTapeTransition(
      current,
      transitions,
      machine.blankSymbol,
    );

    trace.push({
      step: step + 1,
      states: new Set([current.state]),
      configurations: 1,
      tapes: tapesOf(current, machine.blankSymbol),
    });
  }

  return {
    accepted: false,
    halted: false,
    exceededStepLimit: true,
    trace,
  };
}
