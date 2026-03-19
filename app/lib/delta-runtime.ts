const DELTA_D_TS = `
declare namespace Delta {
  interface NFA {
    name: string;
    alphabet: Set<string>;
    states: Set<string>;
    startState: string;
    acceptStates: Set<string>;
    transitions: Map<string, Map<string, Set<string>>>;
    messages: Message[];
  }

  interface Message {
    content: string;
    severity: "warning" | "error";
  }

  class StateProxy {
    /** Self-transition on one or more symbols. No args = loop on entire alphabet.
     * @example s.loop("a", "b") // self-loop on a and b
     * @example s.loop()         // self-loop on all symbols
     */
    loop(...symbols: string[]): this;

    /** Transition to target on one or more symbols.
     * @example s.to("q1", "a", "b") // transition to q1 on a and b
     */
    to(target: string, ...symbols: string[]): this;

    /** Return to the builder to continue chaining. */
    done(): NFABuilder;
  }

  class NFABuilder {
    /** Define the input alphabet.
     * @example .alphabet("a", "b")
     */
    alphabet(...symbols: string[]): this;

    /** Declare states. Use Delta.q() for numbered states.
     * @example .states("q0", "q1", "q2")
     * @example .states(...Delta.q(0, 14))
     */
    states(...states: string[]): this;

    /** Set the start state.
     * @example .start("q0")
     */
    start(state: string): this;

    /** Set one or more accept states.
     * @example .accept("q2", "q3")
     */
    accept(...states: string[]): this;

    /** Add a transition from → symbol → to.
     * @example .transition("q0", "a", "q1")
     * @example .transition("q0", Delta.EPS, "q1") // epsilon transition
     */
    transition(from: string, symbol: string, to: string): this;

    /** Scope operations to a single state. Chain with .loop(), .to(), .done().
     * @example .state("q0").loop("a", "b").done()
     * @example .state("q0").to("q1", "a").done()
     */
    state(state: string): StateProxy;

    /** Apply operations to all states matching a filter.
     * @example .batch(s => s !== "q0", s => s.loop("a"))
     */
    batch(filter: (state: string) => boolean, apply: (state: StateProxy) => void): this;

    /** Apply operations to every state.
     * @example .all(s => s.loop("0")) // every state loops on 0
     */
    all(apply: (state: StateProxy) => void): this;

    /** Advance through states in declaration order on the given symbols.
     * Wraps around: last state transitions back to first.
     * @example .increment("1") // q0→q1→q2→...→q0 on 1
     */
    increment(...symbols: string[]): this;

    /** Two-way transition: a→b on \`there\`, b→a on \`back\` (defaults to \`there\`).
     * @example .bounce("q0", "0", "q1")       // q0↔q1 on 0
     * @example .bounce("q0", "0", "q1", "1")  // q0→q1 on 0, q1→q0 on 1
     */
    bounce(a: string, there: string, b: string, back?: string): this;

    /** One or more: from→to on symbol, to loops on symbol.
     * @example .plus("q0", "a", "q1") // q0→q1 on a, q1→q1 on a
     */
    plus(from: string, symbol: string, to: string): this;

    /** Zero or more (Kleene star): from loops on symbol, from→to on symbol, to loops on symbol.
     * @example .star("q0", "a", "q1") // q0→q0 on a, q0→q1 on a, q1→q1 on a
     */
    star(from: string, symbol: string, to: string): this;

    /** Validate and return the built NFA. Must be called last. */
    build(): NFA;

    get messages(): readonly Message[];
    get repr(): string;
  }

  class DFABuilder extends NFABuilder {}

  /** Build an NFA. @example const machine = Delta.nfa("myNFA").alphabet(...).build() */
  function nfa(name: string): NFABuilder;

  /** Build a DFA. @example const machine = Delta.dfa("myDFA").alphabet(...).build() */
  function dfa(name: string): DFABuilder;

  /** Generate numbered state names q{lower} through q{upper}.
   * @example Delta.q(0, 4) // ["q0", "q1", "q2", "q3", "q4"]
   */
  const q: (lower: number, upper: number) => string[];

  /** The epsilon symbol for epsilon transitions.
   * @example .transition("q0", Delta.EPS, "q1")
   */
  const EPS: string;
}
`;

export default DELTA_D_TS;
