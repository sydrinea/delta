import type { Message } from './automata'
import type { NFA } from './nfa'
import { EPSILON } from './constants'
import { NFABuilder } from './nfa'

export interface GrammarRule {
  from: string // nonterminal A
  terminal: string // terminal a
  to?: string // optional nonterminal B (A → aB), absent means A → a
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
} as const

export class RegularGrammarBuildError extends Error {
  constructor(public messages: Message[]) {
    super('Regular Grammar Build Failed')
    this.name = 'RegularGrammarBuildError'
    Object.setPrototypeOf(this, RegularGrammarBuildError.prototype)
  }
}

export class RegularGrammarBuilder {
  private _name: string
  private _terminals: Set<string> = new Set()
  private _nonTerminals: Set<string> = new Set()
  private _start: string | null = null
  private _rules: GrammarRule[] = []
  protected _messages: Message[] = []
  private _built = false

  constructor(name: string) {
    this._name = name
  }

  /**
   * Records a diagnostic message (warning or error) for the grammar.
   * Errors prevent `build()` from succeeding.
   */
  protected message(severity: Message['severity'], content: string): void {
    const stack = new Error(content).stack
    this._messages.push({ severity, content, stack })
  }

  /**
   * Declare the terminal symbols (the input alphabet).
   *
   * Terminals correspond to the symbols that appear on the right-hand side of
   * production rules (e.g. the `a` in `A → aB`). They must be declared
   * before being referenced in `rule()`.
   *
   * @param symbols - Terminal symbols, e.g. `'a'`, `'b'`, `'0'`, `'1'`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * grammar('G').terminals('a', 'b')
   */
  public terminals(...symbols: string[]): this {
    symbols.forEach(s => this._terminals.add(s))
    return this
  }

  /**
   * Declare the nonterminal symbols (grammar variables / states).
   *
   * Nonterminals are the uppercase letters or multi-character names that
   * appear on the left-hand side of production rules (e.g. `S`, `A`, `B`).
   * They must be declared before being referenced in `start()` or `rule()`.
   *
   * @param symbols - Nonterminal names, e.g. `'S'`, `'A'`, `'B'`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * grammar('G').nonTerminals('S', 'A', 'B')
   */
  public nonTerminals(...symbols: string[]): this {
    symbols.forEach(s => this._nonTerminals.add(s))
    return this
  }

  /**
   * Set the start symbol — the nonterminal from which all derivations begin.
   *
   * Must have been declared with `nonTerminals()` first.
   *
   * @param symbol - A nonterminal symbol previously declared via `nonTerminals()`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * grammar('G').nonTerminals('S').start('S')
   */
  public start(symbol: string): this {
    if (!this._nonTerminals.has(symbol)) {
      this.message(
        'error',
        RegularGrammarMessages.startSymbolNotDeclared(symbol),
      )
      return this
    }
    this._start = symbol
    return this
  }

  /**
   * Add a right-regular production rule.
   *
   * Two forms are supported:
   * - `rule('A', 'a', 'B')` — `A → aB` (consume terminal `a`, continue in `B`)
   * - `rule('A', 'a')` — `A → a` (consume terminal `a` and accept)
   *
   * All referenced symbols must have been declared before calling `rule()`.
   * Epsilon (`EPS` / `EPSILON`) may be used as the terminal for an
   * epsilon production.
   *
   * @param from - The nonterminal on the left-hand side.
   * @param terminal - The terminal symbol consumed by this rule.
   * @param to - Optional nonterminal on the right-hand side. Omit for a
   *   terminal (accepting) production.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * grammar('ab*')
   *   .terminals('a', 'b')
   *   .nonTerminals('S', 'B')
   *   .start('S')
   *   .rule('S', 'a', 'B') // S → aB
   *   .rule('B', 'b', 'B') // B → bB
   *   .rule('B', 'b')       // B → b
   *   .build()
   */
  public rule(from: string, terminal: string, to?: string): this {
    if (!this._nonTerminals.has(from)) {
      this.message(
        'error',
        RegularGrammarMessages.nonTerminalSourceNotDeclared(from),
      )
    }

    if (terminal !== EPSILON && !this._terminals.has(terminal)) {
      this.message(
        'error',
        RegularGrammarMessages.terminalNotDeclared(terminal),
      )
    }

    if (to !== undefined && !this._nonTerminals.has(to)) {
      this.message(
        'error',
        RegularGrammarMessages.nonTerminalTargetNotDeclared(to),
      )
    }

    this._rules.push({ from, terminal, to })
    return this
  }

  /**
   * Compile the grammar into an equivalent `NFA`.
   *
   * Applies the standard right-regular grammar → NFA conversion:
   * - Each nonterminal becomes a state.
   * - `A → aB` becomes transition `δ(A, a) = B`.
   * - `A → a` (terminal production) becomes `δ(A, a) = F` where `F` is a
   *   synthetic accepting state that collects all such productions.
   * - The start symbol maps to the NFA's start state.
   *
   * Throws `RegularGrammarBuildError` if any error-severity messages exist
   * (e.g. references to undeclared symbols or a missing start symbol).
   *
   * @returns The constructed `NFA`.
   * @throws `RegularGrammarBuildError` if the grammar definition contains errors.
   *
   * @example
   * const nfa = grammar('ab*')
   *   .terminals('a', 'b')
   *   .nonTerminals('S', 'B')
   *   .start('S')
   *   .rule('S', 'a', 'B')
   *   .rule('B', 'b', 'B')
   *   .rule('B', 'b')
   *   .build()
   */
  public build(): NFA {
    if (this._built)
      throw new Error(RegularGrammarMessages.alreadyBuilt)
    this._built = true

    if (!this._start) {
      this.message('error', RegularGrammarMessages.noStartSymbol)
    }

    const errors = this._messages.filter(m => m.severity === 'error')
    if (errors.length > 0) {
      throw new RegularGrammarBuildError(this._messages)
    }

    const ACCEPT = 'F'

    const builder = new NFABuilder(this._name)
      .alphabet(...this._terminals)
      .states(...this._nonTerminals, ACCEPT)
      .start(this._start!)
      .accept(ACCEPT)

    for (const { from, terminal, to } of this._rules) {
      builder.transition(from, terminal, to ?? ACCEPT)
    }

    return builder.build()
  }
}

/**
 * Create a new regular grammar builder that compiles to an NFA.
 *
 * Use the fluent API — `terminals()`, `nonTerminals()`, `start()`, `rule()` —
 * to describe the grammar, then call `build()` to obtain an equivalent `NFA`.
 *
 * @param name - A label for the resulting automaton, used in debug output.
 * @returns A fresh `RegularGrammarBuilder`.
 *
 * @example
 * // Grammar for a(b*)
 * const machine = grammar('ab*')
 *   .terminals('a', 'b')
 *   .nonTerminals('S', 'B')
 *   .start('S')
 *   .rule('S', 'a', 'B') // S → aB
 *   .rule('B', 'b', 'B') // B → bB
 *   .rule('B', 'b')       // B → b
 *   .build()
 */
export default function grammar(name: string): RegularGrammarBuilder {
  return new RegularGrammarBuilder(name)
}
