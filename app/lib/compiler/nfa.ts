import { EPSILON } from "./constants";

/**
 * Represents an NFA of the 5-tuple (Q, Σ, 𝛿, q0, F)
 */
export interface NFA {
  /**
   * A label for the NFA
   */
  name: string;
  /**
   * The alphabet of the NFA (Σ)
   */
  alphabet: Set<string>;
  /**
   * The states of the NFA (Q)
   */
  states: Set<string>;
  /**
   * The starting state of the NFA (q0 ∈ Q)
   */
  startState: string;
  /**
   * The accepting state(s) of the NFA (F ⊆ Q)
   */
  acceptStates: Set<string>;
  /**
   * The transition function of the NFA (𝛿)
   */
  transitions: Map<string, Map<string, Set<string>>>;
  /**
   * Warnings and errors that occured in the construction of the NFA
   */
  messages: Message[];
}

/**
 * Represents a construction warning or error
 */
export interface Message {
  content: string;
  severity: "warning" | "error";
}

/**
 * Everything that may fail when constructing the NFA
 */
export const NFAMessages = {
  startStateNotDeclared: (state: string) =>
    `Start state '${state}' is not a declared state`,
  acceptStateNotDeclared: (state: string) =>
    `Accept state '${state}' is not a declared state`,
  transitionSourceNotDeclared: (state: string) =>
    `Transition source '${state}' is not a declared state`,
  transitionTargetNotDeclared: (state: string) =>
    `Transition target '${state}' is not a declared state`,
  transitionSymbolNotInAlphabet: (symbol: string) =>
    `Transition symbol '${symbol}' is not in the alphabet`,
  missingTransition: (state: string, symbol: string) =>
    `State '${state}' has no transition for symbol '${symbol}'`,
  noStartState: "No start state defined",
  alreadyBuilt: "build() already called",
} as const; // prevent modification

/**
 * Constructs a new NFA with validation
 */
export class NFABuilder {
  protected readonly _name: string;
  protected _alphabet: Set<string> = new Set();
  protected _states: Set<string> = new Set();
  protected _startState: string | null = null;
  protected _acceptStates: Set<string> = new Set();
  protected _transitions: Map<string, Map<string, Set<string>>> = new Map();
  protected _messages: Message[] = [];
  protected _built = false;

  /**
   * Entrypoint for the builder
   * @param name a name for the {@link NFA}
   */
  constructor(name: string) {
    this._name = name;
  }

  /**
   * Records a {@link Message} for the {@link NFA}
   * @param severity
   * @param content
   */
  protected message(severity: Message["severity"], content: string): void {
    this._messages.push({ severity, content });
  }

  /**
   * Describe the alphabet for the {@link NFA}
   * @param symbols the symbols in the alphabet
   * @returns a modified {@link NFABuilder} object
   */
  public alphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => this._alphabet.add(symbol));
    return this;
  }

  /**
   * Create states in the {@link NFA}
   * @param states the states (Q)
   * @returns a modified {@link NFABuilder} object
   */
  public states(...states: string[]): this {
    states.forEach((state) => {
      this._states.add(state);
      this._transitions.set(state, new Map());
    });
    return this;
  }

  /**
   * Assign the start state in the {@link NFA}
   * @param state the starting state (q0)
   * @returns a modified {@link NFABuilder} object
   */
  public start(state: string): this {
    // We want to fail instead of silently adding the state because of potential typos
    if (!this._states.has(state)) {
      this.message("error", NFAMessages.startStateNotDeclared(state));
    }
    this._startState = state;
    return this;
  }

  /**
   * Assign the accepting states in the {@link NFA}
   * @param states the accepting state(s) (F ⊆ Q)
   * @returns a modified {@link NFABuilder} object
   */
  public accept(...states: string[]): this {
    states.forEach((state) => {
      // We want to fail instead of silently adding the state because of potential typos
      if (!this._states.has(state)) {
        this.message("error", NFAMessages.acceptStateNotDeclared(state));
      }
      this._acceptStates.add(state);
    });
    return this;
  }

  /**
   * Create a transition between two states in the {@link NFA}
   * @param from the origin (+out degree)
   * @param symbol the symbol (along the edge)
   * @param to the destination (+in degree)
   * @returns a modified {@link NFABuilder} object
   */
  public transition(from: string, symbol: string, to: string): this {
    // We want to fail instead of silently adding the state because of potential typos
    if (!this._states.has(from)) {
      this.message("error", NFAMessages.transitionSourceNotDeclared(from));
    }

    if (!this._states.has(to)) {
      this.message("error", NFAMessages.transitionTargetNotDeclared(to));
    }

    if (!this._alphabet.has(symbol) && symbol !== EPSILON) {
      this.message(
        "warning",
        NFAMessages.transitionSymbolNotInAlphabet(symbol),
      );
    }

    const valid =
      this._states.has(from) &&
      this._states.has(to) &&
      (this._alphabet.has(symbol) || symbol === EPSILON);

    // Prevent improper adding of a transition
    if (!valid) {
      return this;
    }

    const fromMap = this._transitions.get(from)!;

    if (!fromMap.has(symbol)) {
      fromMap.set(symbol, new Set());
    }
    fromMap.get(symbol)!.add(to);

    return this;
  }

  /**
   * Retrieve all messages
   * @return a list of messages
   */
  public get messages(): readonly Message[] {
    return this._messages;
  }

  /**
   * Build the {@link NFA} and perform validation for missing definitions
   * @returns the corresponding {@link NFA}
   * @throws if any {@link Message}s are errors
   */
  public build(): NFA {
    if (this._built) throw new Error(NFAMessages.alreadyBuilt);
    this._built = true;

    if (!this._startState) {
      this.message("error", NFAMessages.noStartState);
    }

    for (const [state, symbolMap] of this._transitions) {
      for (const symbol of this._alphabet) {
        if (!symbolMap.has(symbol)) {
          this.message("warning", NFAMessages.missingTransition(state, symbol));
        }
      }
    }

    const errors = this._messages.filter((m) => m.severity === "error");
    if (errors.length > 0) {
      throw new Error(errors.map((m) => m.content).join("\n"));
    }

    return {
      name: this._name,
      alphabet: this._alphabet,
      states: this._states,
      startState: this._startState!,
      acceptStates: this._acceptStates,
      transitions: this._transitions,
      messages: this._messages,
    };
  }

  /**
   * A string repr for the {@link NFA}
   */
  public get repr(): string {
    const states = [...this._states].join(", ");
    const alphabet = [...this._alphabet].join(", ");
    const accept = [...this._acceptStates].join(", ");

    const transitions = [...this._transitions.entries()].flatMap(
      ([from, symbolMap]) =>
        [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
          [...toSet].map((to) => `\t${from} ---${symbol}---> ${to}`),
        ),
    );

    return `
nfa ${this._name} {
    states: ${states}
    alphabet: ${alphabet}
    start: ${this._startState ?? "(unset)"}
    accept: ${accept}
    transitions:
${transitions.join("\n")}
}
    `;
  }
}

/**
 * Construct an NFA
 * @param name the name of the NFA
 * @returns an {@link NFABuilder} (fluent API)
 */
export default function nfa(name: string): NFABuilder {
  return new NFABuilder(name);
}
