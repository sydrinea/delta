import type { AutomataModel, Message } from './automata'
import {
  Automata,
  AutomataMessages,

} from './automata'
import { EPS, EPSILON } from './constants'

export type { Message } from './automata'

export interface NFA extends AutomataModel {
  /**
   * The transition function of the NFA (𝛿)
   */
  transitions: Map<string, Map<string, Set<string>>>
}

/**
 * Everything that may fail when constructing the NFA
 */
export const NFAMessages = {
  ...AutomataMessages,
  transitionSymbolNotInAlphabet: (symbol: string) =>
    `Transition symbol '${symbol}' is not in the alphabet`,
  missingTransition: (state: string, symbol: string) =>
    `State '${state}' has no transition for symbol '${symbol}'`,
  epsilonInAlphabet: `${EPS} cannot be declared as part of the alphabet`,
} as const

export class NFABuildError extends Error {
  constructor(public messages: Message[]) {
    super('NFA Build Failed')
    this.name = 'NFABuildError'
    Object.setPrototypeOf(this, NFABuildError.prototype)
  }
}

export class NFABuilder extends Automata {
  protected _transitions: Map<string, Map<string, Set<string>>> = new Map()
  protected _built = false

  /**
   * Create a new `NFABuilder`.
   *
   * Prefer the top-level `nfa(name)` factory function over calling this
   * constructor directly — it keeps usage concise and consistent.
   *
   * @param name - A human-readable label for the resulting NFA, used in
   *   debug output and error messages.
   */
  constructor(name: string) {
    super(name)
  }

  protected override startStateNotDeclaredMessage(state: string): string {
    return NFAMessages.startStateNotDeclared(state)
  }

  protected override acceptStateNotDeclaredMessage(state: string): string {
    return NFAMessages.acceptStateNotDeclared(state)
  }

  /**
   * Declare the input alphabet for this NFA.
   *
   * Epsilon (`ε`) is implicitly available for transitions and must **not**
   * be listed here — doing so is an error.
   *
   * @param symbols - The symbols the NFA can read from the input tape.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * nfa('even-zeros').alphabet('0', '1')
   */
  public alphabet(...symbols: string[]): this {
    symbols.forEach((symbol) => {
      if (symbol === EPS) {
        this.message('error', NFAMessages.epsilonInAlphabet)
      }
    })
    return super.alphabet(...symbols)
  }

  /**
   * Declare the states of this NFA.
   *
   * States must be declared before they can appear in `start()`, `accept()`,
   * or any `transition()` call. Each state is initialised with an empty
   * outgoing-transition map.
   *
   * @param states - Unique state identifiers, e.g. `'q0'`, `'q1'`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * nfa('example').states('q0', 'q1', 'q2')
   *
   * // Generate a numbered range with the q() helper:
   * nfa('example').states(...q(0, 5))
   */
  public states(...states: string[]): this {
    super.states(...states)
    states.forEach((state) => {
      this._transitions.set(state, new Map())
    })
    return this
  }

  /**
   * Add a transition edge from one state to another on a given symbol.
   *
   * Both `from` and `to` must already be declared states. The `symbol` must
   * belong to the declared alphabet, or be `EPSILON` / `EPS` for a free
   * (epsilon) move. Violations are recorded as errors or warnings and the
   * transition is not added.
   *
   * Multiple `transition()` calls with the same `from`/`symbol` pair add
   * additional destinations — this is what makes the machine nondeterministic.
   *
   * @param from - Source state.
   * @param symbol - Input symbol consumed by this transition (or `EPSILON`).
   * @param to - Destination state.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * nfa('ab*')
   *   .alphabet('a', 'b')
   *   .states('q0', 'q1')
   *   .start('q0').accept('q1')
   *   .transition('q0', 'a', 'q1')
   *   .transition('q1', 'b', 'q1')
   */
  public transition(from: string, symbol: string, to: string): this {
    // We want to fail instead of silently adding the state because of potential typos
    if (!this._states.has(from)) {
      this.message('error', NFAMessages.transitionSourceNotDeclared(from))
    }

    if (!this._states.has(to)) {
      this.message('error', NFAMessages.transitionTargetNotDeclared(to))
    }

    if (!this._alphabet.has(symbol) && symbol !== EPSILON) {
      this.message(
        'warning',
        NFAMessages.transitionSymbolNotInAlphabet(symbol),
      )
    }

    const valid
      = this._states.has(from)
        && this._states.has(to)
        && (this._alphabet.has(symbol) || symbol === EPSILON)

    // Prevent improper adding of a transition
    if (!valid) {
      return this
    }

    const fromMap = this._transitions.get(from)!

    if (!fromMap.has(symbol)) {
      fromMap.set(symbol, new Set())
    }
    fromMap.get(symbol)!.add(to)

    return this
  }

  /**
   * Open a scoped editing context for a single state.
   *
   * Returns a `StateProxy` whose `loop()` and `to()` methods all operate on
   * the chosen state. Call `done()` on the proxy to return to the builder.
   *
   * @param state - The state to scope operations to.
   * @returns A `StateProxy` bound to `state`.
   *
   * @example
   * nfa('example')
   *   .alphabet('0', '1')
   *   .states('q0', 'q1')
   *   .start('q0').accept('q1')
   *   .state('q0').loop('0').to('q1', '1').done()
   *   .build()
   */
  public state(state: string): StateProxy {
    return new StateProxy(state, this)
  }

  /**
   * Apply transitions to every state that passes a filter predicate.
   *
   * Useful when a subset of states share the same transition pattern —
   * for example, every non-accepting state should loop on `'0'`.
   *
   * @param filter - Predicate; receives each declared state name, return
   *   `true` to include it.
   * @param apply - Callback that receives a `StateProxy` for each matching
   *   state. Call `loop()`, `to()`, etc. inside the callback.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * builder.batch(
   *   s => s !== 'qAccept',
   *   proxy => proxy.loop('0')
   * )
   */
  public batch(
    filter: (state: string) => boolean,
    apply: (builder: StateProxy) => void,
  ): this {
    for (const state of this._states) {
      if (filter(state)) {
        apply(new StateProxy(state, this))
      }
    }
    return this
  }

  /**
   * Apply transitions to **every** declared state.
   *
   * Equivalent to `batch(() => true, apply)`. Handy for adding a self-loop
   * on some symbol to every state in one call.
   *
   * @param apply - Callback that receives a `StateProxy` for each state.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * // Every state loops on 'x'
   * builder.all(s => s.loop('x'))
   */
  public all(apply: (builder: StateProxy) => void): this {
    return this.batch(_ => true, apply)
  }

  /**
   * Wire a linear chain of transitions through all declared states in order.
   *
   * For each symbol, adds `q0 → q1 → q2 → … → q0` (wrapping around). This
   * is a shortcut for machines that count modulo the number of states.
   *
   * @param symbols - One or more symbols that trigger the advancement.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * // Counts occurrences of 'a' mod 3
   * nfa('mod3')
   *   .alphabet('a')
   *   .states('q0', 'q1', 'q2')
   *   .start('q0').accept('q0')
   *   .increment('a')
   *   .build()
   */
  public increment(...symbols: string[]): this {
    const states = [...this._states]
    for (const symbol of symbols) {
      for (let i = 0; i < states.length; i++) {
        this.transition(states[i], symbol, states[(i + 1) % states.length])
      }
    }
    return this
  }

  /**
   * Add a symmetric (two-way) transition between two states.
   *
   * Adds `a --there--> b` and `b --back--> a`. When `back` is omitted both
   * directions use the same symbol.
   *
   * @param a - First state.
   * @param there - Symbol to move from `a` to `b`.
   * @param b - Second state.
   * @param back - Symbol to move from `b` back to `a`. Defaults to `there`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * // Toggle between q0 and q1 on '0'; use '1' to come back
   * builder.bounce('q0', '0', 'q1', '1')
   */
  public bounce(
    a: string,
    there: string,
    b: string,
    back: string = there,
  ): this {
    return this.transition(a, there, b).transition(b, back, a)
  }

  /**
   * Wire a "one or more" pattern: `from --symbol--> to --symbol--> to`.
   *
   * The machine must consume `symbol` at least once to reach `to`, and can
   * then stay in `to` by consuming `symbol` repeatedly.
   *
   * @param from - State that starts the chain.
   * @param symbol - Symbol that drives the transition.
   * @param to - Destination state; also gains a self-loop on `symbol`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * // Accepts one or more 'a's
   * nfa('a+')
   *   .alphabet('a')
   *   .states('q0', 'q1')
   *   .start('q0').accept('q1')
   *   .plus('q0', 'a', 'q1')
   *   .build()
   */
  public plus(from: string, symbol: string, to: string): this {
    return this.transition(from, symbol, to).transition(to, symbol, to)
  }

  /**
   * Wire a "zero or more" pattern on `symbol`.
   *
   * Adds a self-loop on `from`, a self-loop on `to`, and a transition
   * `from --symbol--> to`. The machine can stay in `from` indefinitely, move
   * to `to` on `symbol`, and continue looping there.
   *
   * @param from - Source state (also gains a self-loop).
   * @param symbol - Symbol consumed by the transition.
   * @param to - Destination state; also gains a self-loop on `symbol`.
   * @returns The same builder so calls can be chained.
   *
   * @example
   * // Accepts zero or more 'b's followed by zero or more 'c's
   * nfa('b*c*')
   *   .alphabet('b', 'c')
   *   .states('q0', 'q1')
   *   .start('q0').accept('q1')
   *   .star('q0', 'b', 'q1')
   *   .star('q1', 'c', 'q1')
   *   .build()
   */
  public star(from: string, symbol: string, to: string): this {
    return this.transition(from, symbol, from).plus(from, symbol, to)
  }

  /**
   * Finalise the builder and produce a validated `NFA` object.
   *
   * Checks that:
   * - A start state has been set.
   * - Every state has a transition for every alphabet symbol (missing
   *   transitions are recorded as **warnings**, not errors).
   *
   * Throws `NFABuildError` if any **error**-severity messages exist.
   * After a successful call the builder is sealed and cannot be reused.
   *
   * @returns The constructed `NFA`.
   * @throws `NFABuildError` if the machine definition contains errors.
   *
   * @example
   * const machine = nfa('accepts-a')
   *   .alphabet('a')
   *   .states('q0', 'q1')
   *   .start('q0').accept('q1')
   *   .transition('q0', 'a', 'q1')
   *   .build()
   */
  public build(): NFA {
    if (this._built)
      throw new Error(NFAMessages.alreadyBuilt)
    this._built = true

    if (!this._startState) {
      this.message('error', NFAMessages.noStartState)
    }

    for (const [state, symbolMap] of this._transitions) {
      for (const symbol of this._alphabet) {
        if (!symbolMap.has(symbol)) {
          this.message('warning', NFAMessages.missingTransition(state, symbol))
        }
      }
    }

    this.throwIfAnyErrors(() => new NFABuildError(this._messages))

    return {
      name: this._name,
      alphabet: this._alphabet,
      states: this._states,
      startState: this._startState!,
      acceptStates: this._acceptStates,
      transitions: this._transitions,
      messages: this._messages,
    }
  }

  /**
   * A human-readable multi-line representation of the NFA's current state.
   *
   * Lists states, alphabet, start state, accept states, and all transitions.
   * Useful for quick visual inspection during development.
   *
   * @example
   * console.log(builder.repr)
   * // nfa accepts-a {
   * //     states: q0, q1
   * //     alphabet: a
   * //     start: q0
   * //     accept: q1
   * //     transitions:
   * //         q0 ---a---> q1
   * // }
   */
  public get repr(): string {
    const states = [...this._states].join(', ')
    const alphabet = [...this._alphabet].join(', ')
    const accept = [...this._acceptStates].join(', ')

    const transitions = [...this._transitions.entries()].flatMap(
      ([from, symbolMap]) =>
        [...symbolMap.entries()].flatMap(([symbol, toSet]) =>
          Array.from(toSet, to => `\t${from} ---${symbol}---> ${to}`),
        ),
    )

    return `
nfa ${this._name} {
    states: ${states}
    alphabet: ${alphabet}
    start: ${this._startState ?? '(unset)'}
    accept: ${accept}
    transitions:
${transitions.join('\n')}
}
    `
  }
}

/**
 * A scoped helper returned by `NFABuilder.state()` that binds transition
 * operations to a single, pre-selected state.
 *
 * Use `loop()` and `to()` to add transitions, then call `done()` to return
 * to the underlying `NFABuilder` and continue building the automaton.
 *
 * @example
 * nfa('example')
 *   .alphabet('0', '1')
 *   .states('q0', 'q1')
 *   .start('q0').accept('q1')
 *   .state('q0')
 *     .loop('0')      // q0 --0--> q0
 *     .to('q1', '1')  // q0 --1--> q1
 *   .done()
 *   .build()
 */
class StateProxy {
  constructor(
    private readonly state: string,
    private readonly builder: NFABuilder,
  ) {}

  /**
   * Add a self-loop on one or more symbols.
   *
   * When called with no arguments, adds a self-loop for **every** symbol in
   * the current alphabet — useful for "trap" or "sink" states.
   *
   * @param symbols - Symbols on which the state loops. Defaults to all
   *   alphabet symbols when omitted.
   * @returns This proxy for further chaining.
   *
   * @example
   * proxy.loop('a', 'b') // loops on 'a' and 'b'
   * proxy.loop()         // loops on every alphabet symbol
   */
  public loop(...symbols: string[]): this {
    const toLoop = symbols.length > 0 ? symbols : this.builder.alpha
    toLoop.forEach(symbol =>
      this.builder.transition(this.state, symbol, this.state),
    )
    return this
  }

  /**
   * Add a transition from this state to `target` on one or more symbols.
   *
   * @param target - The destination state.
   * @param symbols - One or more symbols that trigger the transition.
   * @returns This proxy for further chaining.
   *
   * @example
   * proxy.to('q2', 'a', 'b') // this state --a--> q2 and --b--> q2
   */
  public to(target: string, ...symbols: string[]): this {
    symbols.forEach(symbol =>
      this.builder.transition(this.state, symbol, target),
    )
    return this
  }

  /**
   * Exit the scoped state context and return to the parent `NFABuilder`.
   *
   * @returns The `NFABuilder` that created this proxy.
   */
  public done(): NFABuilder {
    return this.builder
  }
}

/**
 * Create a new NFA (Nondeterministic Finite Automaton) builder.
 *
 * Returns an `NFABuilder` with a fluent API. Chain calls to `alphabet()`,
 * `states()`, `start()`, `accept()`, and `transition()` (or helpers such as
 * `plus()`, `star()`, `bounce()`) to describe the machine, then call
 * `build()` to obtain the final `NFA` object.
 *
 * @param name - A label for the automaton, used in debug output.
 * @returns A fresh `NFABuilder`.
 *
 * @example
 * // Accepts strings over {a, b} that end with 'b'
 * const machine = nfa('ends-with-b')
 *   .alphabet('a', 'b')
 *   .states('q0', 'q1')
 *   .start('q0').accept('q1')
 *   .state('q0').loop('a', 'b').to('q1', 'b').done()
 *   .build()
 */
export default function nfa(name: string): NFABuilder {
  return new NFABuilder(name)
}
