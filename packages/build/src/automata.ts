/**
 * Represents a construction warning or error.
 */
export interface Message {
  content: string
  severity: 'warning' | 'error'
  stack?: string
}

/**
 * Common properties shared by automata models.
 */
export interface AutomataModel {
  name: string
  alphabet: Set<string>
  states: Set<string>
  startState: string
  acceptStates: Set<string>
  messages: Message[]
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
  noStartState: 'No start state defined',
  alreadyBuilt: 'build() already called',
} as const

/**
 * Base class for automata builders that share common state and operations.
 */
export abstract class Automata {
  protected readonly _name: string
  protected _alphabet: Set<string> = new Set()
  public _states: Set<string> = new Set()
  protected _startState: string | null = null
  protected _acceptStates: Set<string> = new Set()
  protected _messages: Message[] = []

  constructor(name: string) {
    this._name = name
  }

  protected abstract startStateNotDeclaredMessage(state: string): string
  protected abstract acceptStateNotDeclaredMessage(state: string): string

  /**
   * Records a diagnostic message (warning or error) for the automaton.
   * Errors prevent `build()` from succeeding; warnings are informational.
   */
  protected message(severity: Message['severity'], content: string): void {
    const stack = new Error(content).stack
    this._messages.push({ severity, content, stack })
  }

  /**
   * Returns all error-severity messages collected so far.
   * Used internally to decide whether `build()` should throw.
   */
  protected errors(): Message[] {
    return this._messages.filter(m => m.severity === 'error')
  }

  /**
   * Throws the error returned by `createError` if any error-severity messages
   * exist. Called at the end of `build()` to surface accumulated errors.
   */
  protected throwIfAnyErrors<E extends Error>(createError: () => E): void {
    if (this.errors().length > 0) {
      throw createError()
    }
  }

  /**
   * Declare the input alphabet — the set of symbols the machine can read.
   *
   * Call this before adding transitions so that the builder can validate
   * that every transition symbol belongs to the alphabet.
   *
   * @example
   * nfa('binary').alphabet('0', '1')
   */
  public alphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => {
      this._alphabet.add(symbol)
    })
    return this
  }

  /**
   * Declare the states of the automaton (Q).
   *
   * States must be declared before they can be used in `start()`, `accept()`,
   * or any transition call. Referencing an undeclared state is an error.
   *
   * @example
   * nfa('example').states('q0', 'q1', 'q2')
   *
   * // Use the q() helper to generate a numbered sequence:
   * nfa('example').states(...q(0, 4)) // 'q0', 'q1', 'q2', 'q3', 'q4'
   */
  public states(...states: string[]): this {
    states.forEach((state) => {
      this._states.add(state)
    })
    return this
  }

  /**
   * Set the initial (start) state — the state the machine begins in.
   *
   * The state must have been declared with `states()` first.
   * Only one start state is allowed; calling `start()` again overwrites
   * the previous value.
   *
   * @example
   * nfa('example').states('q0', 'q1').start('q0')
   */
  public start(state: string): this {
    if (!this._states.has(state)) {
      this.message('error', this.startStateNotDeclaredMessage(state))
    }
    this._startState = state
    return this
  }

  /**
   * Mark one or more states as accepting (final) states.
   *
   * A string is accepted when the machine halts in one of these states.
   * Every state must have been declared with `states()` first.
   *
   * @example
   * nfa('example').states('q0', 'q1', 'q2').accept('q2')
   */
  public accept(...states: string[]): this {
    states.forEach((state) => {
      if (!this._states.has(state)) {
        this.message('error', this.acceptStateNotDeclaredMessage(state))
      }
      this._acceptStates.add(state)
    })
    return this
  }

  /**
   * All diagnostic messages (warnings and errors) emitted during construction.
   *
   * Inspect this after calling `build()` to surface warnings — e.g., states
   * that are missing transitions for some alphabet symbols.
   */
  public get messages(): readonly Message[] {
    return this._messages
  }

  /**
   * The currently declared alphabet as a plain array.
   *
   * Useful when iterating over symbols, e.g. inside `batch()` or `all()`.
   */
  public get alpha(): readonly string[] {
    return [...this._alphabet]
  }
}
