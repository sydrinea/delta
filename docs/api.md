# API

## Builders

### `nfa(name: string): NFABuilder`

Build an NFA.

```ts
const machine = Delta.nfa("myNFA").alphabet(...).build()
```

### `dfa(name: string): DFABuilder`

Build a DFA.

```ts
const machine = Delta.dfa("myDFA").alphabet(...).build()
```

### `thompson(name: string): ThompsonBuilder`

Build an NFA using Thompson's construction (RPN stack-based builder).

```ts
const machine = Delta.thompson("myNFA").char("a").star().build();
```

---

## `NFABuilder` & `DFABuilder`

### `alphabet(...symbols: string[]): this`

Define the input alphabet.

```ts
.alphabet("a", "b")
```

### `states(...states: string[]): this`

Declare states. Use Delta.q() for numbered states.

```ts
.states("q0", "q1", "q2")
.states(...Delta.q(0, 14))
```

### `start(state: string): this`

Set the start state.

```ts
.start("q0")
```

### `accept(...states: string[]): this`

Set one or more accept states.

```ts
.accept("q2", "q3")
```

### `transition(from: string, symbol: string, to: string): this`

Add a transition from → symbol → to.

```ts
.transition("q0", "a", "q1")
.transition("q0", Delta.EPS, "q1") // epsilon transition
```

### `state(state: string): StateProxy`

Scope operations to a single state. Chain with .loop(), .to(), .done().

```ts
.state("q0").loop("a", "b").done()
.state("q0").to("q1", "a").done()
```

### `batch(filter: (state: string) => boolean, apply: (state: StateProxy) => void): this`

Apply operations to all states matching a filter.

```ts
.batch(s => s !== "q0", s => s.loop("a"))
```

### `all(apply: (state: StateProxy) => void): this`

Apply operations to every state.

```ts
.all(s => s.loop("0")) // every state loops on 0
```

### `increment(...symbols: string[]): this`

Advance through states in declaration order on the given symbols. Wraps around: last state transitions back to first.

```ts
.increment("1") // q0→q1→q2→...→q0 on 1
```

### `bounce(a: string, there: string, b: string, back?: string): this`

Two-way transition: a→b on `there`, b→a on `back` (defaults to `there`).

```ts
.bounce("q0", "0", "q1")       // q0↔q1 on 0
.bounce("q0", "0", "q1", "1")  // q0→q1 on 0, q1→q0 on 1
```

### `plus(from: string, symbol: string, to: string): this`

One or more: from→to on symbol, to loops on symbol.

```ts
.plus("q0", "a", "q1") // q0→q1 on a, q1→q1 on a
```

### `star(from: string, symbol: string, to: string): this`

Zero or more (Kleene star): from loops on symbol, from→to on symbol, to loops on symbol.

```ts
.star("q0", "a", "q1") // q0→q0 on a, q0→q1 on a, q1→q1 on a
```

### `build(): NFA`

Validate and return the built NFA. Must be called last.

---

## `StateProxy`

### `loop(...symbols: string[]): this`

Self-transition on one or more symbols. No args = loop on entire alphabet.

```ts
s.loop("a", "b"); // self-loop on a and b
s.loop(); // self-loop on all symbols
```

### `to(target: string, ...symbols: string[]): this`

Transition to target on one or more symbols.

```ts
s.to("q1", "a", "b"); // transition to q1 on a and b
```

### `done(): NFABuilder`

Return to the builder to continue chaining.

---

## `ThompsonBuilder`

### `char(s: string): this`

Push an NFA accepting a single character onto the stack.

```ts
.char("a")
```

### `machine(nfa: NFA): this`

Push an NFA onto the stack.

```ts
a sub-machine to be composed with others (like composing machines for (ab)* (ab)*)
```

### `eps(): this`

Push an NFA accepting only the epsilon (empty string) onto the stack.

```ts
.eps()
```

### `union(): this`

Pop two NFAs off the stack, union them (a | b), and push the result.

```ts
.char("a").char("b").union()
```

### `concat(): this`

Pop two NFAs off the stack, concatenate them (ab), and push the result.

```ts
.char("a").char("b").concat()
```

### `star(): this`

Pop one NFA off the stack, apply the Kleene star (a\*), and push the result.

```ts
.char("a").star()
```

### `build(): NFA`

Validate the stack has exactly one NFA and return it. Must be called last.

---

## Primitives & Utilities

### `q(lower: number, upper: number): string[]`

Generate numbered state names q{lower} through q{upper}.

```ts
Delta.q(0, 4); // ["q0", "q1", "q2", "q3", "q4"]
```

### `union(a: NFA, b: NFA): NFA`

Construct an NFA representing the union of two NFAs (a | b).

```ts
Delta.union(nfaA, nfaB);
```

### `concat(a: NFA, b: NFA): NFA`

Construct an NFA representing the concatenation of two NFAs (ab).

```ts
Delta.concat(nfaA, nfaB);
```

### `star(a: NFA): NFA`

Construct an NFA representing the Kleene star of an NFA (a\*).

```ts
Delta.star(nfaA);
```

### `char(s: string): NFA`

Construct an NFA that accepts a single character.

```ts
Delta.char("a");
```

### `epsilon(): NFA`

Construct an NFA that accepts only the empty string (epsilon).

```ts
Delta.epsilon();
```

### `convertToDFA(nfa: NFA, options?: ConvertOptions): NFA`

Convert an NFA into an equivalent DFA using subset construction.

```ts
const dfa = Delta.convertToDFA(myNfa, { name: "myEquivalentDfa" });
```

### `EPS`

The epsilon symbol for epsilon transitions.

```ts
.transition("q0", Delta.EPS, "q1")
```
