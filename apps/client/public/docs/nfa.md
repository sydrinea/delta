# NFAs

Nondeterministic Finite Automata allow multiple transitions on the same symbol and epsilon (ε) transitions — moves that consume no input. Use `nfa()` from `@delta/build`.

## Basic Structure

```ts
import { EPS, nfa } from '@delta/build'

const machine = nfa('name')
  .alphabet('0', '1')
  .states('q0', 'q1', 'q2')
  .start('q0')
  .accept('q2')
  // transitions...
  .build()
```

The alphabet must not include `EPS` — epsilon is a reserved symbol used only in transition calls.

## Transitions

### `.transition(from, symbol, to)`

The core transition method. Unlike a DFA, you can add multiple transitions from the same state on the same symbol, and the machine will explore all of them nondeterministically.

**Epsilon transitions** use the `EPS` constant as the symbol:

```ts
.transition("q0", EPS, "q1")  // ε-transition: no input consumed
```

### Shorthand Methods

| Method                                    | Behavior                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `.loop(state, ...symbols)` via StateProxy | Self-transition on the given symbols                                         |
| `.bounce(a, there, b, back?)`             | Bidirectional transition; `back` defaults to `there`                         |
| `.plus(from, symbol, to)`                 | Transition from→to, plus a self-loop on `to` ("one or more")                 |
| `.star(from, symbol, to)`                 | Self-loop on `from`, transition to `to`, self-loop on `to` ("zero or more")  |
| `.increment(...symbols)`                  | Advance through all declared states in order on each symbol, wrapping around |

### State Scoping

`.state(stateName)` returns a `StateProxy` that scopes transitions to a single state, keeping long definitions readable:

```ts
builder
  .state('q0')
  .loop('a') // q0 --a--> q0
  .to('q1', 'b') // q0 --b--> q1
```

Call `.done()` on the proxy to return to the builder.

### Bulk Transitions

`.batch(filter, apply)` and `.all(apply)` let you apply a transition pattern across multiple states at once:

```ts
// Loop on "0" in every state whose name starts with "q"
builder.batch(
  s => s.startsWith('q'),
  proxy => proxy.loop('0'),
)

// Apply to every state
builder.all(proxy => proxy.loop('b'))
```

## Validation

`.build()` throws `NFABuildError` if there are errors (undeclared states, unknown symbols). Missing transitions for declared symbols produce warnings instead of errors.
