/**
 * Represents a construction warning or error.
 */
export interface Message {
  content: string;
  severity: "warning" | "error";
  stack?: string;
}

/**
 * Common properties shared by automata models.
 */
export interface AutomataModel {
  name: string;
  alphabet: Set<string>;
  states: Set<string>;
  startState: string;
  acceptStates: Set<string>;
  messages: Message[];
}

/**
 * Common message templates shared by automata builders.
 */
export const AutomataMessages = {
  startStateNotDeclared: (state: string) =>
    `Start state '${state}' is not a declared state`,
  acceptStateNotDeclared: (state: string) =>
    `Accept state '${state}' is not a declared state`,
  transitionSourceNotDeclared: (state: string) =>
    `Transition source '${state}' is not a declared state`,
  transitionTargetNotDeclared: (state: string) =>
    `Transition target '${state}' is not a declared state`,
  noStartState: "No start state defined",
  alreadyBuilt: "build() already called",
} as const;

/**
 * Base class for automata builders that share common state and operations.
 */
export abstract class Automata {
  protected readonly _name: string;
  protected _alphabet: Set<string> = new Set();
  public _states: Set<string> = new Set();
  protected _startState: string | null = null;
  protected _acceptStates: Set<string> = new Set();
  protected _messages: Message[] = [];

  constructor(name: string) {
    this._name = name;
  }

  protected abstract startStateNotDeclaredMessage(state: string): string;
  protected abstract acceptStateNotDeclaredMessage(state: string): string;

  /**
   * Records a {@link Message} for the automaton.
   */
  protected message(severity: Message["severity"], content: string): void {
    const stack = new Error().stack;
    this._messages.push({ severity, content, stack });
  }

  /**
   * Describe the alphabet.
   */
  public alphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => {
      this._alphabet.add(symbol);
    });
    return this;
  }

  /**
   * Create states.
   */
  public states(...states: string[]): this {
    states.forEach((state) => {
      this._states.add(state);
    });
    return this;
  }

  /**
   * Assign the start state.
   */
  public start(state: string): this {
    if (!this._states.has(state)) {
      this.message("error", this.startStateNotDeclaredMessage(state));
    }
    this._startState = state;
    return this;
  }

  /**
   * Assign the accepting states.
   */
  public accept(...states: string[]): this {
    states.forEach((state) => {
      if (!this._states.has(state)) {
        this.message("error", this.acceptStateNotDeclaredMessage(state));
      }
      this._acceptStates.add(state);
    });
    return this;
  }

  /**
   * Retrieve all messages.
   */
  public get messages(): readonly Message[] {
    return this._messages;
  }

  /**
   * Retrieve the current alphabet.
   */
  public get alpha(): readonly string[] {
    return [...this._alphabet];
  }
}
