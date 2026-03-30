import { NFABuilder } from "./nfa";
import type { NFA } from "./nfa";
import type { Message } from "./automata";
import { EPSILON } from "./constants";

export interface GrammarRule {
  from: string; // nonterminal A
  terminal: string; // terminal a
  to?: string; // optional nonterminal B (A → aB), absent means A → a
}

export const RegularGrammarMessages = {
  nonTerminalSourceNotDeclared: (nt: string) =>
    `Nonterminal source '${nt}' is not declared`,
  nonTerminalTargetNotDeclared: (nt: string) =>
    `Nonterminal target '${nt}' is not declared`,
  terminalNotDeclared: (t: string) => `Terminal '${t}' is not declared`,
  noStartSymbol: `No start symbol defined`,
  startSymbolNotDeclared: (s: string) =>
    `Start symbol '${s}' is not a declared nonterminal symbol`,
  alreadyBuilt: `Grammar has already been built`,
} as const;

export class RegularGrammarBuildError extends Error {
  constructor(public messages: Message[]) {
    super("Regular Grammar Build Failed");
    this.name = "RegularGrammarBuildError";
    Object.setPrototypeOf(this, RegularGrammarBuildError.prototype);
  }
}

export class RegularGrammarBuilder {
  private _name: string;
  private _terminals: Set<string> = new Set();
  private _nonTerminals: Set<string> = new Set();
  private _start: string | null = null;
  private _rules: GrammarRule[] = [];
  protected _messages: Message[] = [];
  private _built = false;

  constructor(name: string) {
    this._name = name;
  }

  /**
   * Records a {@link Message} for the automaton.
   */
  protected message(severity: Message["severity"], content: string): void {
    const stack = new Error().stack;
    this._messages.push({ severity, content, stack });
  }

  /**
   * Declare the terminal symbols (alphabet)
   */
  public terminals(...symbols: string[]): this {
    symbols.forEach((s) => this._terminals.add(s));
    return this;
  }

  /**
   * Declare the nonterminal symbols (states)
   */
  public nonTerminals(...symbols: string[]): this {
    symbols.forEach((s) => this._nonTerminals.add(s));
    return this;
  }

  /**
   * Set the start symbol
   */
  public start(symbol: string): this {
    if (!this._nonTerminals.has(symbol)) {
      this.message(
        "error",
        RegularGrammarMessages.startSymbolNotDeclared(symbol),
      );
      return this;
    }
    this._start = symbol;
    return this;
  }

  /**
   * Add a production rule
   * A → aB  (pass `to`)
   * A → a   (omit `to`)
   */
  public rule(from: string, terminal: string, to?: string): this {
    if (!this._nonTerminals.has(from)) {
      this.message(
        "error",
        RegularGrammarMessages.nonTerminalSourceNotDeclared(from),
      );
    }

    if (terminal !== EPSILON && !this._terminals.has(terminal)) {
      this.message(
        "error",
        RegularGrammarMessages.terminalNotDeclared(terminal),
      );
    }

    if (to !== undefined && !this._nonTerminals.has(to)) {
      this.message(
        "error",
        RegularGrammarMessages.nonTerminalTargetNotDeclared(to),
      );
    }

    this._rules.push({ from, terminal, to });
    return this;
  }

  /**
   * Build into an NFA via the standard right-regular grammar conversion:
   *   - each nonterminal → state
   *   - A → aB  becomes δ(A, a) = B
   *   - A → a   becomes δ(A, a) = Z
   *   - start symbol → start state
   *   - synthetic accept state collects all terminal productions
   */
  public build(): NFA {
    if (this._built) throw new Error(RegularGrammarMessages.alreadyBuilt);
    this._built = true;

    if (!this._start) {
      this.message("error", RegularGrammarMessages.noStartSymbol);
    }

    const errors = this._messages.filter((m) => m.severity === "error");
    if (errors.length > 0) {
      throw new RegularGrammarBuildError(this._messages);
    }

    const ACCEPT = "F";

    const builder = new NFABuilder(this._name)
      .alphabet(...this._terminals)
      .states(...this._nonTerminals, ACCEPT)
      .start(this._start!)
      .accept(ACCEPT);

    for (const { from, terminal, to } of this._rules) {
      builder.transition(from, terminal, to ?? ACCEPT);
    }

    return builder.build();
  }
}

/**
 * Construct a regular grammar that compiles to an NFA
 * @param name the name of the grammar
 * @returns a {@link RegularGrammarBuilder} (fluent API)
 */
export default function grammar(name: string): RegularGrammarBuilder {
  return new RegularGrammarBuilder(name);
}
