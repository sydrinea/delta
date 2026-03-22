const DELTA_D_TS = `
declare module "delta:lib" {
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

  /** Build an NFA using Thompson's construction (RPN stack-based builder). 
   * @example const machine = Delta.thompson("myNFA").char("a").star().build() 
   */
  function thompson(name: string): ThompsonBuilder;

  class ThompsonBuilder {
    /** Push an NFA accepting a single character onto the stack. 
     * @example .char("a") 
     */
    char(s: string): this;

    /** Push an NFA onto the stack.
     * @example a sub-machine to be composed with others (like composing machines for (ab)* (ab)*)
     */
    machine(nfa: NFA): this;

    /** Push an NFA accepting only the epsilon (empty string) onto the stack. 
     * @example .eps() 
     */
    eps(): this;

    /** Pop two NFAs off the stack, union them (a | b), and push the result. 
     * @example .char("a").char("b").union() 
     */
    union(): this;

    /** Pop two NFAs off the stack, concatenate them (ab), and push the result. 
     * @example .char("a").char("b").concat() 
     */
    concat(): this;

    /** Pop one NFA off the stack, apply the Kleene star (a*), and push the result. 
     * @example .char("a").star() 
     */
    star(): this;

    /** Validate the stack has exactly one NFA and return it. Must be called last. */
    build(): NFA;
  }

  /** Generate numbered state names q{lower} through q{upper}.
   * @example Delta.q(0, 4) // ["q0", "q1", "q2", "q3", "q4"]
   */
  const q: (lower: number, upper: number) => string[];

  /** Construct an NFA representing the union of two NFAs (a | b). 
   * @example Delta.union(nfaA, nfaB) 
   */
  function union(a: NFA, b: NFA): NFA;

  /** Construct an NFA representing the concatenation of two NFAs (ab). 
   * @example Delta.concat(nfaA, nfaB) 
   */
  function concat(a: NFA, b: NFA): NFA;

  /** Construct an NFA representing the Kleene star of an NFA (a*). 
   * @example Delta.star(nfaA) 
   */
  function star(a: NFA): NFA;

  /** Construct an NFA that accepts a single character. 
   * @example Delta.char("a") 
   */
  function char(s: string): NFA;

  /** Construct an NFA that accepts only the empty string (epsilon). 
   * @example Delta.epsilon() 
   */
  function epsilon(): NFA;

  /**
   * Customization for the result of NFA-to-DFA conversion.
   */
  interface ConvertOptions {
    /**
     * A UI name for the DFA
     */
    name?: string;
    /**
     * Whether to preserve meaning of states (i.e. {q0, q2} vs. {qN})
     */
    preserveNames?: boolean;
  }

  /** Convert an NFA into an equivalent DFA using subset construction.
   * @example const dfa = Delta.convertToDFA(myNfa, { name: "myEquivalentDfa" })
   */
  function convertToDFA(nfa: NFA, options?: ConvertOptions): NFA;

  /** The epsilon symbol for epsilon transitions.
   * @example .transition("q0", Delta.EPS, "q1")
   */
  const EPS: string;

  interface Delta {
    nfa: typeof nfa;
    dfa: typeof dfa;
    thompson: typeof thompson;
    convertToDFA: typeof convertToDFA;
    q: typeof q;
    union: typeof union;
    concat: typeof concat;
    star: typeof star;
    char: typeof char;
    epsilon: typeof epsilon;
    empty: typeof empty;
    EPS: typeof EPS;
  }

  export const nfa: typeof nfa;
  export const dfa: typeof dfa;
  export const thompson: typeof thompson;
  export const convertToDFA: typeof convertToDFA;
  export const q: typeof q;
  export const union: typeof union;
  export const concat: typeof concat;
  export const star: typeof star;
  export const char: typeof char;
  export const epsilon: typeof epsilon;
  export const empty: typeof empty;
  export const EPS: typeof EPS;
  
  const api: Delta;
  export default api;
}
`;

export default DELTA_D_TS;
