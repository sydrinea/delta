import { EPSILON } from "./constants";

export interface NFA {
  name: string;
  alphabet: Set<string>;
  states: Set<string>;
  startState: string;
  acceptStates: Set<string>;
  transitions: Map<string, Map<string, Set<string>>>;
  messages: Message[];
}

export interface Message {
  content: string;
  severity: "warning" | "error";
}

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
} as const;

export class NFABuilder {
  protected readonly _name: string;
  protected _alphabet: Set<string> = new Set();
  protected _states: Set<string> = new Set();
  protected _startState: string | null = null;
  protected _acceptStates: Set<string> = new Set();
  protected _transitions: Map<string, Map<string, Set<string>>> = new Map();
  protected _messages: Message[] = [];
  protected _built = false;

  constructor(name: string) {
    this._name = name;
  }

  protected message(severity: Message["severity"], content: string): void {
    this._messages.push({ severity, content });
  }

  public alphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => this._alphabet.add(symbol));
    return this;
  }

  public states(...states: string[]): this {
    states.forEach((state) => {
      this._states.add(state);
      this._transitions.set(state, new Map());
    });
    return this;
  }

  public start(state: string): this {
    if (!this._states.has(state)) {
      this.message("error", NFAMessages.startStateNotDeclared(state));
    }
    this._startState = state;
    return this;
  }

  public accept(...states: string[]): this {
    states.forEach((state) => {
      if (!this._states.has(state)) {
        this.message("error", NFAMessages.acceptStateNotDeclared(state));
      }
      this._acceptStates.add(state);
    });
    return this;
  }

  public transition(from: string, symbol: string, to: string): this {
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

    if (
      !this._states.has(from) ||
      !this._states.has(to) ||
      (!this._alphabet.has(symbol) && symbol !== EPSILON)
    ) {
      return this;
    }

    const fromMap = this._transitions.get(from)!;
    if (!fromMap.has(symbol)) {
      fromMap.set(symbol, new Set());
    }
    fromMap.get(symbol)!.add(to);

    return this;
  }

  public get messages(): readonly Message[] {
    return this._messages;
  }

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

export default function nfa(name: string): NFABuilder {
  return new NFABuilder(name);
}
