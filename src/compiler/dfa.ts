import { EPSILON } from "./constants.js";
import { NFABuilder, NFA, NFAMessages } from "./nfa.js";

export const DFAMessages = {
  ...NFAMessages,
  missingTransition: (state: string, symbol: string) =>
    `DFA state '${state}' must have exactly one transition for symbol '${symbol}'`,
  nondeterministicTransition: (from: string, symbol: string) =>
    `DFA transition from '${from}' on '${symbol}' is nondeterministic`,
  epsilonTransitionNotAllowed: "DFA transitions cannot use epsilon",
} as const;

class DFABuilder extends NFABuilder {
  public override transition(from: string, symbol: string, to: string): this {
    if (symbol === EPSILON) {
      this.message("error", DFAMessages.epsilonTransitionNotAllowed);
      return this;
    }

    const existing = this._transitions.get(from)?.get(symbol);
    if (existing !== undefined && existing.size > 0) {
      this.message(
        "error",
        DFAMessages.nondeterministicTransition(from, symbol),
      );
      return this;
    }
    return super.transition(from, symbol, to);
  }

  public override build(): NFA {
    if (this._built) throw new Error(DFAMessages.alreadyBuilt);
    this._built = true;

    if (!this._startState) {
      this.message("error", DFAMessages.noStartState);
    }

    for (const [state, symbolMap] of this._transitions) {
      for (const symbol of this._alphabet) {
        if (!symbolMap.has(symbol)) {
          this.message("error", DFAMessages.missingTransition(state, symbol));
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
}

export default function dfa(name: string): DFABuilder {
  return new DFABuilder(name);
}
