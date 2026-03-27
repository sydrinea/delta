import { EPSILON } from "./constants";
import { NFABuilder, NFA, NFAMessages, NFABuildError } from "./nfa";

/**
 * Everything that may fail when constructing the DFA
 * A DFA is an NFA with additional constraints
 */
export const DFAMessages = {
  ...NFAMessages,
  missingTransition: (state: string, symbol: string) =>
    `DFA state '${state}' must have exactly one transition for symbol '${symbol}'`,
  nondeterministicTransition: (from: string, symbol: string) =>
    `DFA transition from '${from}' on '${symbol}' is nondeterministic`,
  epsilonTransitionNotAllowed: "DFA transitions cannot use epsilon",
} as const;

/**
 * Construct a new DFA with validation.
 */
class DFABuilder extends NFABuilder {
  public override transition(from: string, symbol: string, to: string): this {
    // (1) we disallow epsilon transitions
    if (symbol === EPSILON) {
      this.message("error", DFAMessages.epsilonTransitionNotAllowed);
      return this;
    }

    // (2) we don't allow nondeterminism
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

  /**
   * @inheritdoc We duplicate the work because we want warnings from the
   * NFA builder to become errors here
   */
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
      throw new NFABuildError(this._messages);
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

/**
 * Construct a DFA
 * @param name the name of the DFA
 * @returns a {@link DFABuilder} (fluent API)
 */
export default function dfa(name: string): DFABuilder {
  return new DFABuilder(name);
}
