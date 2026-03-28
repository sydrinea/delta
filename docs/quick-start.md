# Quick Start

`@delta/build` is a fluent TypeScript library for constructing formal automata — DFAs, NFAs, and Turing Machines. Every machine is built by chaining method calls on a builder, then calling `.build()` to produce a validated, immutable model.

The build package lives in the monorepo workspace. Import from `@delta/build`:

```ts
import { dfa, nfa, tm, multitape, thompson } from "@delta/build";
```

For epsilon transitions in NFAs, import the constant:

```ts
import { EPS } from "@delta/build";
```

## The Builder Pattern

All builders share the same lifecycle:

1. **Name** — pass a display name to the factory function (`dfa("my machine")`)
2. **Declare** — define the alphabet, states, start state, and accept states
3. **Connect** — add transitions between states
4. **Build** — call `.build()` to validate and freeze the machine

Every builder throws a typed error (`NFABuildError` / `TMBuildError`) on `.build()` if there are validation errors, and attaches warnings to the returned model for non-fatal issues.

```ts
const machine = dfa("example")
  .alphabet("0", "1")
  .states("q0", "q1")
  .start("q0")
  .accept("q1")
  .transition("q0", "0", "q1")
  .transition("q0", "1", "q0")
  .transition("q1", "0", "q1")
  .transition("q1", "1", "q1")
  .build();
```

## Shared Methods

These methods are available on every builder:

| Method                  | Description                |
| ----------------------- | -------------------------- |
| `.alphabet(...symbols)` | Declare the input alphabet |
| `.states(...states)`    | Declare all states         |
| `.start(state)`         | Set the start state        |
| `.accept(...states)`    | Mark states as accepting   |

## Helper: `q(lower, upper)`

Generates a sequential list of state names `["q0", "q1", ..., "qN"]`, useful when you have many numbered states:

```ts
import { q } from "@delta/build";

builder.states(...q(0, 7)); // → "q0" through "q7"
```
