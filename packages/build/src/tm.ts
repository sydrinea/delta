import { EPS } from "./constants";
import {
  Automata,
  AutomataMessages,
  type AutomataModel,
  type Message,
} from "./automata";

export type { Message } from "./automata";

export type Direction = "L" | "R";
export type MoveDirection = Direction | "S";

type BuildTuple<T, N extends number, R extends T[] = []> = R["length"] extends N
  ? R
  : BuildTuple<T, N, [...R, T]>;

type FixedLengthArray<T, N extends number> = number extends N
  ? T[]
  : BuildTuple<T, N>;

export interface TMTupleTransition<N extends number = number> {
  toState: string;
  readSymbols: FixedLengthArray<string, N>;
  writeSymbols: FixedLengthArray<string, N>;
  directions: FixedLengthArray<MoveDirection, N>;
}

export interface TuringMachine<
  N extends number = number,
> extends AutomataModel {
  tapeCount: N;
  tapeAlphabet: Set<string>;
  blankSymbol: string;
  transitions: Map<string, Map<string, TMTupleTransition<N>>>;
}

export type TM = TuringMachine<1>;
export type MultiTM<N extends number = number> = TuringMachine<N>;

type SingleTapeRead = string | string[] | [string | string[]];
type SingleTapeMove = MoveDirection | [MoveDirection];
type SingleTapeWrite = string | undefined | [string | undefined];

export interface TMTransitionSpec {
  from: string;
  to: string;
  read: SingleTapeRead;
  move: SingleTapeMove;
  write?: SingleTapeWrite;
}

type ScopedRead<N extends number> = [N] extends [1]
  ? string | string[] | FixedLengthArray<string | string[], N>
  : FixedLengthArray<string | string[], N>;

type ScopedMove<N extends number> = [N] extends [1]
  ? MoveDirection | FixedLengthArray<MoveDirection, N>
  : FixedLengthArray<MoveDirection, N>;

type ScopedWrite<N extends number> = [N] extends [1]
  ? string | undefined | FixedLengthArray<string | undefined, N>
  : FixedLengthArray<string | undefined, N>;

export const TMMessages = {
  ...AutomataMessages,
  tapeSymbolNotDeclared: (symbol: string) =>
    `Tape symbol '${symbol}' is not in the tape alphabet`,
  blankSymbolNotInTape: (symbol: string) =>
    `Blank symbol '${symbol}' must be part of the tape alphabet`,
  blankSymbolInAlphabet: (symbol: string) =>
    `Blank symbol '${symbol}' cannot be part of the input alphabet`,
  epsilonInTapeAlphabet: `${EPS} cannot be declared as part of the tape alphabet`,
  noBlankSymbol: "No blank symbol defined",
  invalidTapeCount: (count: number) =>
    `Tape count must be a positive integer. Received '${count}'`,
  invalidTupleLength: (expected: number, received: number) =>
    `Transition tuples must have exactly length ${expected}. Received ${received}`,
  duplicateReadTupleTransition: (state: string, tuple: string) =>
    `TM transition from '${state}' on tuple '${tuple}' is already defined`,
} as const;

export interface MultiTMTransitionSpec<N extends number> {
  from: string;
  to: string;
  read: FixedLengthArray<string | string[], N>;
  move: FixedLengthArray<MoveDirection, N>;
  write?: FixedLengthArray<string | undefined, N>;
}

export interface MultiTMStateScope<N extends number> {
  transition(
    spec: Omit<MultiTMTransitionSpec<N>, "from"> & {
      read: ScopedRead<N>;
      move: ScopedMove<N>;
      write?: ScopedWrite<N>;
    },
  ): this;
  on(
    read: ScopedRead<N>,
    move: ScopedMove<N>,
    to: string,
    write?: ScopedWrite<N>,
  ): this;
  /**
   * Scans `tapeIndex` in `direction` looping on `skipSymbols`.
   * Transitions to `toState` when `targetSymbol` is encountered.
   * Other tapes remain stationary and read `otherTapesContext` (defaults to blank).
   */
  seek(
    tapeIndex: number,
    skipSymbols: string | string[],
    targetSymbol: string | string[],
    direction: MoveDirection,
    toState: string,
    otherTapesContext?: string | string[],
    writeTarget?: string,
  ): this;
  done(): MultiTMBuilder<N>;
}

export class TMBuildError extends Error {
  constructor(public messages: Message[]) {
    super("TM Build Failed");
    this.name = "TMBuildError";
    Object.setPrototypeOf(this, TMBuildError.prototype);
  }
}

/**
 * Shared TM builder behavior for single-tape and multi-tape machines.
 */
export abstract class BaseTMBuilder extends Automata {
  protected _transitions: Map<string, Map<string, TMTupleTransition<number>>> =
    new Map();
  protected _tapeAlphabet: Set<string> = new Set();
  protected _blankSymbol: string | null = null;
  protected _built = false;
  protected readonly _tapeCount: number;

  constructor(name: string, tapeCount: number) {
    super(name);
    this._tapeCount = tapeCount;
  }

  protected override startStateNotDeclaredMessage(state: string): string {
    return TMMessages.startStateNotDeclared(state);
  }

  protected override acceptStateNotDeclaredMessage(state: string): string {
    return TMMessages.acceptStateNotDeclared(state);
  }

  /**
   * Declare symbols that can appear on the tape.
   */
  public tape(...symbols: string[]): this {
    symbols.forEach((symbol) => {
      if (symbol === EPS) {
        this.message("error", TMMessages.epsilonInTapeAlphabet);
        return;
      }
      this._tapeAlphabet.add(symbol);
    });
    return this;
  }

  /**
   * Declare the blank symbol (must already be in the tape alphabet).
   */
  public blank(symbol: string): this {
    if (!this._tapeAlphabet.has(symbol)) {
      this.message("error", TMMessages.blankSymbolNotInTape(symbol));
      return this;
    }

    if (this._alphabet.has(symbol)) {
      this.message("error", TMMessages.blankSymbolInAlphabet(symbol));
      return this;
    }

    this._blankSymbol = symbol;
    return this;
  }

  /**
   * Declare the input alphabet (blank symbol is prohibited).
   */
  public override alphabet(...symbols: string[]): this {
    if (this._blankSymbol === null) {
      this.tape(...symbols);
      return super.alphabet(...symbols);
    }

    const toAdd: string[] = [];
    symbols.forEach((symbol) => {
      if (symbol === this._blankSymbol) {
        this.message("error", TMMessages.blankSymbolInAlphabet(symbol));
        return;
      }
      toAdd.push(symbol);
    });

    this.tape(...toAdd);
    return super.alphabet(...toAdd);
  }

  protected tupleReadKey(tuple: string[]): string {
    return tuple.join("\u001F");
  }

  protected stateTupleMap(
    state: string,
  ): Map<string, TMTupleTransition<number>> {
    const current = this._transitions.get(state);
    if (current) {
      return current;
    }

    const created = new Map<string, TMTupleTransition<number>>();
    this._transitions.set(state, created);
    return created;
  }

  protected validateTupleTransition(
    fromState: string,
    toState: string,
    readSymbols: string[],
    writeSymbols: string[],
  ): boolean {
    if (!this._states.has(fromState)) {
      this.message("error", TMMessages.transitionSourceNotDeclared(fromState));
      return false;
    }

    if (!this._states.has(toState)) {
      this.message("error", TMMessages.transitionTargetNotDeclared(toState));
      return false;
    }

    for (const symbol of readSymbols) {
      if (!this._tapeAlphabet.has(symbol)) {
        this.message("error", TMMessages.tapeSymbolNotDeclared(symbol));
        return false;
      }
    }

    for (const symbol of writeSymbols) {
      if (!this._tapeAlphabet.has(symbol)) {
        this.message("error", TMMessages.tapeSymbolNotDeclared(symbol));
        return false;
      }
    }

    return true;
  }

  protected addTupleTransition(
    fromState: string,
    toState: string,
    readSymbols: string[],
    writeSymbols: string[],
    directions: MoveDirection[],
    duplicateMessage: string,
  ): void {
    if (
      readSymbols.length !== this._tapeCount ||
      writeSymbols.length !== this._tapeCount ||
      directions.length !== this._tapeCount
    ) {
      this.message(
        "error",
        TMMessages.invalidTupleLength(this._tapeCount, readSymbols.length),
      );
      return;
    }

    if (
      !this.validateTupleTransition(
        fromState,
        toState,
        readSymbols,
        writeSymbols,
      )
    ) {
      return;
    }

    const stateMap = this.stateTupleMap(fromState);
    const key = this.tupleReadKey(readSymbols);

    if (stateMap.has(key)) {
      this.message("error", duplicateMessage);
      return;
    }

    stateMap.set(key, {
      toState,
      readSymbols,
      writeSymbols,
      directions,
    });
  }

  protected validateBuildState(): void {
    if (!this._startState) {
      this.message("error", TMMessages.noStartState);
    }

    if (!this._blankSymbol) {
      this.message("error", TMMessages.noBlankSymbol);
    } else if (!this._tapeAlphabet.has(this._blankSymbol)) {
      this.message("error", TMMessages.blankSymbolNotInTape(this._blankSymbol));
    } else if (this._alphabet.has(this._blankSymbol)) {
      this.message(
        "error",
        TMMessages.blankSymbolInAlphabet(this._blankSymbol),
      );
    }
  }

  protected throwIfErrors(): void {
    const errors = this._messages.filter((m) => m.severity === "error");
    if (errors.length > 0) {
      throw new TMBuildError(this._messages);
    }
  }

  protected markBuilt(): void {
    if (this._built) {
      throw new Error(TMMessages.alreadyBuilt);
    }
    this._built = true;
  }

  public get tapeCount(): number {
    return this._tapeCount;
  }
}

export class MultiTMBuilder<N extends number> extends BaseTMBuilder {
  constructor(name: string, tapeCount: N) {
    super(name, tapeCount);
  }

  private toReadSymbolsArray(read: string | string[]): string[] {
    return Array.isArray(read) ? read : [read];
  }

  private formatTuple(tuple: string[]): string {
    return `(${tuple.join(",")})`;
  }

  private expandReadTuples(spec: MultiTMTransitionSpec<N>): string[][] {
    const readArray = spec.read as (string | string[])[];
    const tapes = readArray.map((r) => this.toReadSymbolsArray(r));

    return tapes.reduce<string[][]>(
      (acc, symbols) =>
        acc.flatMap((prefix) => symbols.map((symbol) => [...prefix, symbol])),
      [[]],
    );
  }

  public transition(spec: MultiTMTransitionSpec<N>): this {
    const tuples = this.expandReadTuples(spec);

    tuples.forEach((tuple) => {
      const writeArr = spec.write as (string | undefined)[] | undefined;
      const writeSymbols = tuple.map((readSymbol, i) =>
        writeArr && writeArr[i] !== undefined ? writeArr[i]! : readSymbol,
      );
      const directions = spec.move;

      this.addTupleTransition(
        spec.from,
        spec.to,
        tuple,
        writeSymbols,
        directions as MoveDirection[],
        TMMessages.duplicateReadTupleTransition(
          spec.from,
          this.formatTuple(tuple),
        ),
      );
    });

    return this;
  }

  public state(
    fromState: string,
    build: (s: MultiTMStateScope<N>) => void,
  ): this {
    const normalizeRead = (
      read: ScopedRead<N>,
    ): FixedLengthArray<string | string[], N> => {
      if (this._tapeCount === 1) {
        if (Array.isArray(read)) {
          if (
            read.length === 1 &&
            (typeof read[0] === "string" || Array.isArray(read[0]))
          ) {
            return [read[0] as string | string[]] as FixedLengthArray<
              string | string[],
              N
            >;
          }

          return [read as string[]] as FixedLengthArray<string | string[], N>;
        }

        return [read as string] as FixedLengthArray<string | string[], N>;
      }

      return read as FixedLengthArray<string | string[], N>;
    };

    const normalizeMove = (
      move: ScopedMove<N>,
    ): FixedLengthArray<MoveDirection, N> => {
      if (this._tapeCount === 1 && !Array.isArray(move)) {
        return [move] as FixedLengthArray<MoveDirection, N>;
      }
      return move as FixedLengthArray<MoveDirection, N>;
    };

    const normalizeWrite = (
      write: ScopedWrite<N> | undefined,
      move: ScopedMove<N>,
    ): FixedLengthArray<string | undefined, N> | undefined => {
      if (write === undefined) {
        return undefined;
      }

      if (this._tapeCount === 1 && !Array.isArray(move)) {
        return [
          write as unknown as string | undefined,
        ] as unknown as FixedLengthArray<string | undefined, N>;
      }

      return write as FixedLengthArray<string | undefined, N>;
    };

    const scope: MultiTMStateScope<N> = {
      transition: (spec) => {
        scope.on(
          spec.read as ScopedRead<N>,
          spec.move as ScopedMove<N>,
          spec.to,
          spec.write as ScopedWrite<N> | undefined,
        );
        return scope;
      },
      on: (read, move, to, write) => {
        const normalizedRead = normalizeRead(read);
        const normalizedMove = normalizeMove(move);
        const normalizedWrite = normalizeWrite(write, move);

        this.transition({
          from: fromState,
          read: normalizedRead,
          move: normalizedMove,
          to,
          write: normalizedWrite,
        } as MultiTMTransitionSpec<N>);
        return scope;
      },
      seek: (
        tapeIndex,
        skipSymbols,
        targetSymbol,
        direction,
        toState,
        otherTapesContext,
        writeTarget,
      ) => {
        const skips = this.toReadSymbolsArray(skipSymbols);
        const targets = this.toReadSymbolsArray(targetSymbol);
        const others = otherTapesContext
          ? this.toReadSymbolsArray(otherTapesContext)
          : [this._blankSymbol ?? "_"];

        const readLoop = [...Array(this._tapeCount).keys()].map((i) =>
          i === tapeIndex ? skips : others,
        ) as FixedLengthArray<string | string[], N>;
        const readTarget = [...Array(this._tapeCount).keys()].map((i) =>
          i === tapeIndex ? targets : others,
        ) as FixedLengthArray<string | string[], N>;
        const moveTuple = [...Array(this._tapeCount).keys()].map((i) =>
          i === tapeIndex ? direction : "S",
        ) as FixedLengthArray<MoveDirection, N>;

        scope.on(readLoop, moveTuple, fromState);

        if (writeTarget !== undefined) {
          const writeTuple = [...Array(this._tapeCount).keys()].map((i) =>
            i === tapeIndex ? writeTarget : undefined,
          ) as FixedLengthArray<string | undefined, N>;
          scope.on(readTarget, moveTuple, toState, writeTuple);
        } else {
          scope.on(readTarget, moveTuple, toState);
        }

        return scope;
      },
      done: () => this,
    };
    build(scope);
    return this;
  }

  public build(): MultiTM<N> {
    this.markBuilt();
    this.validateBuildState();
    this.throwIfErrors();

    return {
      name: this._name,
      alphabet: this._alphabet,
      states: this._states,
      startState: this._startState!,
      acceptStates: this._acceptStates,
      messages: this._messages,
      tapeCount: this._tapeCount as N,
      tapeAlphabet: this._tapeAlphabet,
      blankSymbol: this._blankSymbol!,
      transitions: this._transitions as unknown as Map<
        string,
        Map<string, TMTupleTransition<N>>
      >,
    };
  }
}

export class TMBuilder extends MultiTMBuilder<1> {
  constructor(name: string) {
    super(name, 1);
  }

  private normalizeRead(read: SingleTapeRead): [string | string[]] {
    if (!Array.isArray(read)) {
      return [read];
    }

    if (read.length === 1) {
      return [read[0] as string | string[]];
    }

    return [read as string[]];
  }

  private normalizeMove(move: SingleTapeMove): [MoveDirection] {
    return Array.isArray(move) ? (move as [MoveDirection]) : [move];
  }

  private normalizeWrite(
    write?: SingleTapeWrite,
  ): [string | undefined] | undefined {
    if (write === undefined) {
      return undefined;
    }

    return Array.isArray(write) ? (write as [string | undefined]) : [write];
  }

  public override transition(spec: MultiTMTransitionSpec<1>): this;
  public transition(spec: TMTransitionSpec): this;
  public override transition(
    spec: MultiTMTransitionSpec<1> | TMTransitionSpec,
  ): this {
    const singleSpec = spec as TMTransitionSpec;

    return super.transition({
      from: singleSpec.from,
      to: singleSpec.to,
      read: this.normalizeRead(singleSpec.read),
      move: this.normalizeMove(singleSpec.move),
      write: this.normalizeWrite(singleSpec.write),
    });
  }

  public override build(): TM {
    return super.build() as TM;
  }
}

export default function tm(name: string): TMBuilder {
  return new TMBuilder(name);
}

export function multitape<const N extends number>(
  name: string,
  tapeCount: N,
): MultiTMBuilder<N> {
  if (!Number.isInteger(tapeCount) || tapeCount <= 0) {
    throw new Error(TMMessages.invalidTapeCount(tapeCount));
  }

  return new MultiTMBuilder(name, tapeCount);
}
