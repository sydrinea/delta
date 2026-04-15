import type { AutomataModel, Message } from './automata'
import {
  Automata,
  AutomataMessages,
} from './automata'
import { EPS, EPSILON } from './constants'

export type { Message } from './automata'

export interface PDATransition {
  toState: string
  /**
   * The input symbol consumed by this transition, or `EPSILON` / `EPS` for
   * a free move that does not consume any input.
   */
  inputSymbol: string
  /**
   * The stack symbol popped before the transition fires.
   *
   * Use `EPSILON` / `EPS` to peek at the stack without popping.
   */
  stackPop: string
  /**
   * The symbols pushed onto the stack after the transition fires,
   * listed top-to-bottom (first element ends up on top).
   *
   * An empty array pops without pushing — effectively a stack pop.
   */
  stackPush: string[]
}

export interface PDA extends AutomataModel {
  /**
   * The stack alphabet (Γ) — the set of symbols that may appear on the stack.
   *
   * Must include `initialStackSymbol`. Does not have to overlap with the
   * input alphabet.
   */
  stackAlphabet: Set<string>
  /**
   * The symbol placed at the bottom of the stack before the machine starts.
   *
   * Conventionally `'Z'` or `'$'`. Detecting this symbol indicates the stack
   * is empty.
   */
  initialStackSymbol: string
  /**
   * The transition function of the PDA (𝛿).
   *
   * Outer key: source state. Inner key: composite `inputSymbol\u001FstackPop`
   * — use the `pdaTransitionKey()` helper to build it.
   */
  transitions: Map<string, Map<string, PDATransition>>
}

/**
 * Build the composite key used as the inner map key in `PDA.transitions`.
 *
 * Keys are formed as `inputSymbol + '\u001F' + stackPop`, matching the
 * convention used by the TM builder for its tuple read keys.
 */
export function pdaTransitionKey(inputSymbol: string, stackPop: string): string {
  return `${inputSymbol}\u001F${stackPop}`
}

/**
 * Everything that may fail when constructing the PDA.
 */
export const PDAMessages = {
  ...AutomataMessages,
  transitionSymbolNotInAlphabet: (symbol: string) =>
    `Transition input symbol '${symbol}' is not in the alphabet`,
  stackPopNotInStackAlphabet: (symbol: string) =>
    `Stack pop symbol '${symbol}' is not in the stack alphabet`,
  stackPushNotInStackAlphabet: (symbol: string) =>
    `Stack push symbol '${symbol}' is not in the stack alphabet`,
  initialStackSymbolNotInStackAlphabet: (symbol: string) =>
    `Initial stack symbol '${symbol}' must be part of the stack alphabet`,
  noInitialStackSymbol: 'No initial stack symbol defined',
  duplicateTransition: (state: string, input: string, pop: string) =>
    `PDA transition from '${state}' on (input='${input}', pop='${pop}') is already defined`,
  epsilonInAlphabet: `${EPS} cannot be declared as part of the alphabet`,
  epsilonInStackAlphabet: `${EPS} cannot be declared as part of the stack alphabet`,
} as const

export class PDABuildError extends Error {
  constructor(public messages: Message[]) {
    super('PDA Build Failed')
    this.name = 'PDABuildError'
    Object.setPrototypeOf(this, PDABuildError.prototype)
  }
}

export class PDABuilder extends Automata {
  protected _transitions: Map<string, Map<string, PDATransition>> = new Map()
  protected _stackAlphabet: Set<string> = new Set()
  protected _initialStackSymbol: string | null = null
  protected _built = false

  /**
   * Create a new `PDABuilder`.
   *
   * Prefer the top-level `pda(name)` factory function over calling this
   * constructor directly — it keeps usage concise and consistent.
   *
   * @param name - A human-readable label for the resulting PDA, used in
   *   debug output and error messages.
   */
  constructor(name: string) {
    super(name)
  }

  protected override startStateNotDeclaredMessage(state: string): string {
    return PDAMessages.startStateNotDeclared(state)
  }

  protected override acceptStateNotDeclaredMessage(state: string): string {
    return PDAMessages.acceptStateNotDeclared(state)
  }

  /**
   * Declare the input alphabet for this PDA.
   *
   * Epsilon (`ε`) is implicitly available for transitions and must **not**
   * be listed here — doing so is an error.
   *
   * @param symbols - The symbols the PDA can read from the input tape.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * pda('balanced-parens').alphabet('(', ')')
   */
  public override alphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => {
      if (symbol === EPS) {
        this.message('error', PDAMessages.epsilonInAlphabet)
      }
    })
    return super.alphabet(...symbols)
  }

  /**
   * Declare the states of this PDA.
   *
   * States must be declared before they can appear in `start()`, `accept()`,
   * or any `transition()` call. Each state is initialised with an empty
   * outgoing-transition map.
   *
   * @param states - Unique state identifiers, e.g. `'q0'`, `'q1'`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * pda('example').states('q0', 'q1', 'q2')
   */
  public override states(...states: string[]): this {
    super.states(...states)
    states.forEach((state) => {
      this._transitions.set(state, new Map())
    })
    return this
  }

  /**
   * Declare the stack alphabet (Γ) — the symbols that may appear on the stack.
   *
   * Must include the `initialStackSymbol`. Epsilon (`ε`) may not appear in the
   * stack alphabet.
   *
   * @param symbols - Stack symbols, including any working symbols and the
   *   intended initial stack symbol.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * pda('balanced-parens').stackAlphabet('Z', 'A').initialStack('Z')
   */
  public stackAlphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => {
      if (symbol === EPS) {
        this.message('error', PDAMessages.epsilonInStackAlphabet)
        return
      }
      this._stackAlphabet.add(symbol)
    })
    return this
  }

  /**
   * Set the symbol placed at the bottom of the stack before the machine starts.
   *
   * The symbol must already be part of the stack alphabet (declared via
   * `stackAlphabet()`). Conventionally `'Z'` or `'$'` is used.
   *
   * @param symbol - The initial stack symbol.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * pda('example').stackAlphabet('Z', 'A').initialStack('Z')
   */
  public initialStack(symbol: string): this {
    if (!this._stackAlphabet.has(symbol)) {
      this.message(
        'error',
        PDAMessages.initialStackSymbolNotInStackAlphabet(symbol),
      )
      return this
    }

    this._initialStackSymbol = symbol
    return this
  }

  /**
   * Add a transition from one state to another on a given input symbol and
   * stack operation.
   *
   * Both `from` and `to` must already be declared states. `input` must belong
   * to the declared alphabet, or be `EPSILON` / `EPS` for a free move. `pop`
   * and every symbol in `push` must belong to the declared stack alphabet, or
   * be `EPSILON` / `EPS` to skip the pop.
   *
   * Each `(from, input, pop)` combination may only appear once — PDA
   * transitions are deterministic per key.
   *
   * @param from - Source state.
   * @param input - Input symbol consumed (or `EPSILON` to not consume input).
   * @param pop - Stack symbol popped before firing (or `EPSILON` to not pop).
   * @param push - Symbols pushed after firing, top-to-bottom. `[]` = pop only.
   * @param to - Destination state.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * // Push 'A' when reading '(' while 'Z' is on top
   * pda('balanced').transition('q0', '(', 'Z', ['A', 'Z'], 'q0')
   *
   * // Pop 'A' when reading ')' while 'A' is on top
   * pda('balanced').transition('q0', ')', 'A', [], 'q0')
   *
   * // Epsilon transition: move without consuming input or touching the stack
   * pda('example').transition('q0', EPSILON, EPSILON, [], 'q1')
   */
  public transition(
    from: string,
    input: string,
    pop: string,
    push: string[],
    to: string,
  ): this {
    if (!this._states.has(from)) {
      this.message('error', PDAMessages.transitionSourceNotDeclared(from))
    }

    if (!this._states.has(to)) {
      this.message('error', PDAMessages.transitionTargetNotDeclared(to))
    }

    if (!this._alphabet.has(input) && input !== EPSILON) {
      this.message('warning', PDAMessages.transitionSymbolNotInAlphabet(input))
    }

    if (!this._stackAlphabet.has(pop) && pop !== EPSILON) {
      this.message('error', PDAMessages.stackPopNotInStackAlphabet(pop))
    }

    for (const symbol of push) {
      if (!this._stackAlphabet.has(symbol)) {
        this.message('error', PDAMessages.stackPushNotInStackAlphabet(symbol))
      }
    }

    const valid
      = this._states.has(from)
        && this._states.has(to)
        && (this._alphabet.has(input) || input === EPSILON)
        && (this._stackAlphabet.has(pop) || pop === EPSILON)
        && push.every(s => this._stackAlphabet.has(s))

    // Prevent adding a transition with invalid symbols or undeclared states
    if (!valid) {
      return this
    }

    const stateMap = this._transitions.get(from)!
    const key = pdaTransitionKey(input, pop)

    if (stateMap.has(key)) {
      this.message('error', PDAMessages.duplicateTransition(from, input, pop))
      return this
    }

    stateMap.set(key, { toState: to, inputSymbol: input, stackPop: pop, stackPush: push })
    return this
  }

  /**
   * Open a scoped editing context for all transitions leaving `fromState`.
   *
   * Returns a `PDAStateProxy` whose `on()` method implicitly binds `from` to
   * `fromState`. Call `done()` on the proxy to return to the builder.
   *
   * @param fromState - The source state for every transition added via the proxy.
   * @returns A `PDAStateProxy` bound to `fromState`.
   *
   * @example
   * pda('balanced-parens')
   *   .alphabet('(', ')')
   *   .states('q0', 'q1')
   *   .stackAlphabet('Z', 'A').initialStack('Z')
   *   .start('q0').accept('q1')
   *   .state('q0')
   *     .on('(', 'Z', ['A', 'Z'], 'q0') // push A on top of Z when reading '('
   *     .on('(', 'A', ['A', 'A'], 'q0') // push A on top of A when reading '('
   *     .on(')', 'A', [], 'q0')          // pop A when reading ')'
   *     .on(EPSILON, 'Z', ['Z'], 'q1')   // move to accept when stack is empty
   *   .done()
   *   .build()
   */
  public state(fromState: string): PDAStateProxy {
    return new PDAStateProxy(fromState, this)
  }

  /**
   * Finalise the builder and produce a validated `PDA` object.
   *
   * Checks that:
   * - A start state has been set.
   * - An initial stack symbol has been declared and is in the stack alphabet.
   *
   * Throws `PDABuildError` if any **error**-severity messages exist.
   * After a successful call the builder is sealed and cannot be reused.
   *
   * @returns The constructed `PDA`.
   * @throws `PDABuildError` if the machine definition contains errors.
   *
   * @example
   * const machine = pda('a-n-b-n')
   *   .alphabet('a', 'b')
   *   .states('q0', 'q1', 'q2')
   *   .stackAlphabet('Z', 'A').initialStack('Z')
   *   .start('q0').accept('q2')
   *   .transition('q0', 'a', 'Z', ['A', 'Z'], 'q0')
   *   .transition('q0', 'a', 'A', ['A', 'A'], 'q0')
   *   .transition('q0', 'b', 'A', [], 'q1')
   *   .transition('q1', 'b', 'A', [], 'q1')
   *   .transition('q1', EPSILON, 'Z', ['Z'], 'q2')
   *   .build()
   */
  public build(): PDA {
    if (this._built)
      throw new Error(PDAMessages.alreadyBuilt)
    this._built = true

    if (!this._startState) {
      this.message('error', PDAMessages.noStartState)
    }

    if (!this._initialStackSymbol) {
      this.message('error', PDAMessages.noInitialStackSymbol)
    }
    else if (!this._stackAlphabet.has(this._initialStackSymbol)) {
      this.message(
        'error',
        PDAMessages.initialStackSymbolNotInStackAlphabet(this._initialStackSymbol),
      )
    }

    this.throwIfAnyErrors(() => new PDABuildError(this._messages))

    return {
      name: this._name,
      alphabet: this._alphabet,
      states: this._states,
      startState: this._startState!,
      acceptStates: this._acceptStates,
      stackAlphabet: this._stackAlphabet,
      initialStackSymbol: this._initialStackSymbol!,
      transitions: this._transitions,
      messages: this._messages,
    }
  }

  /**
   * A human-readable multi-line representation of the PDA's current state.
   *
   * Lists states, alphabets, start state, accept states, and all transitions.
   * Useful for quick visual inspection during development.
   *
   * @example
   * console.log(builder.repr)
   * // pda balanced-parens {
   * //     states: q0, q1
   * //     alphabet: (, )
   * //     stack alphabet: Z, A
   * //     initial stack: Z
   * //     start: q0
   * //     accept: q1
   * //     transitions:
   * //         q0 ---( / Z → AZ---> q0
   * //         q0 --) / A → ---> q0
   * // }
   */
  public get repr(): string {
    const states = [...this._states].join(', ')
    const alphabet = [...this._alphabet].join(', ')
    const stackAlphabet = [...this._stackAlphabet].join(', ')
    const accept = [...this._acceptStates].join(', ')

    const transitions = [...this._transitions.entries()].flatMap(
      ([from, keyMap]) =>
        Array.from(keyMap.values(), (t) => {
          const pushStr = t.stackPush.length > 0 ? t.stackPush.join('') : EPS
          return `\t${from} ---${t.inputSymbol} / ${t.stackPop} → ${pushStr}---> ${t.toState}`
        }),
    )

    return `
pda ${this._name} {
    states: ${states}
    alphabet: ${alphabet}
    stack alphabet: ${stackAlphabet}
    initial stack: ${this._initialStackSymbol ?? '(unset)'}
    start: ${this._startState ?? '(unset)'}
    accept: ${accept}
    transitions:
${transitions.join('\n')}
}
    `
  }
}

/**
 * A scoped helper returned by `PDABuilder.state()` that binds transition
 * operations to a single, pre-selected source state.
 *
 * Use `on()` to add transitions, then call `done()` to return to the
 * underlying `PDABuilder` and continue building the automaton.
 *
 * @example
 * pda('example')
 *   .state('q0')
 *     .on('a', 'Z', ['A', 'Z'], 'q0')  // read 'a', pop 'Z', push 'A','Z'
 *     .on(EPSILON, 'Z', ['Z'], 'q1')   // epsilon move to accept
 *   .done()
 */
class PDAStateProxy {
  constructor(
    private readonly fromState: string,
    private readonly builder: PDABuilder,
  ) {}

  /**
   * Add a transition from this state on the given input / stack operation.
   *
   * @param input - Input symbol consumed (or `EPSILON` to not consume input).
   * @param pop - Stack symbol popped before firing (or `EPSILON` to not pop).
   * @param push - Symbols pushed after firing, top-to-bottom. `[]` = pop only.
   * @param to - Destination state.
   * @returns This proxy for further chaining.
   *
   * @example
   * proxy
   *   .on('a', 'Z', ['A', 'Z'], 'q0') // read 'a', pop Z, push A then Z
   *   .on('b', 'A', [], 'q1')          // read 'b', pop A, push nothing
   */
  public on(input: string, pop: string, push: string[], to: string): this {
    this.builder.transition(this.fromState, input, pop, push, to)
    return this
  }

  /**
   * Exit the scoped state context and return to the parent `PDABuilder`.
   *
   * @returns The `PDABuilder` that created this proxy.
   */
  public done(): PDABuilder {
    return this.builder
  }
}

/**
 * Create a new Pushdown Automaton (PDA) builder.
 *
 * Returns a `PDABuilder` with a fluent API. Chain calls to `alphabet()`,
 * `states()`, `stackAlphabet()`, `initialStack()`, `start()`, `accept()`,
 * and `transition()` (or the scoped `state()` helper) to describe the
 * machine, then call `build()` to obtain the final `PDA` object.
 *
 * PDAs are NFAs augmented with a stack: each transition specifies which input
 * symbol to consume, which stack symbol to pop, and which symbols to push.
 *
 * @param name - A label for the automaton, used in debug output.
 * @returns A fresh `PDABuilder`.
 *
 * @example
 * // Accepts strings of the form aⁿbⁿ (n ≥ 1)
 * const machine = pda('a-n-b-n')
 *   .alphabet('a', 'b')
 *   .states('q0', 'q1', 'q2')
 *   .stackAlphabet('Z', 'A').initialStack('Z')
 *   .start('q0').accept('q2')
 *   .transition('q0', 'a', 'Z', ['A', 'Z'], 'q0') // first 'a': push A over Z
 *   .transition('q0', 'a', 'A', ['A', 'A'], 'q0') // subsequent 'a': push A
 *   .transition('q0', 'b', 'A', [], 'q1')          // first 'b': pop A
 *   .transition('q1', 'b', 'A', [], 'q1')          // subsequent 'b': pop A
 *   .transition('q1', EPSILON, 'Z', ['Z'], 'q2')   // stack empty: accept
 *   .build()
 */
export default function pda(name: string): PDABuilder {
  return new PDABuilder(name)
}
