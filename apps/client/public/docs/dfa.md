# DFAs

Deterministic Finite Automata are NFAs with two additional constraints: no epsilon transitions, and exactly one transition per state per symbol. Use `dfa()` from `delta:lib`.

## Basic Structure

```ts
import { dfa } from 'delta:lib'

const machine = dfa('name')
  .alphabet(...)
  .states(...)
  .start(...)
  .accept(...)
  .transition(...)
  .build()
```

`DFABuilder` extends `NFABuilder`, so all NFA methods are available — including `.bounce()`, `.plus()`, `.increment()`, `.batch()`, `.all()`, and state scoping via `.state()`.

## Additional Constraints

### No Epsilon Transitions

Calling `.transition(from, EPS, to)` on a DFA builder is an error.

### Total Transition Function

Every declared state must have **exactly one** outgoing transition for every symbol in the alphabet. Missing or duplicate transitions are both errors — `.build()` will throw if either condition is violated.

```ts
// If q1 is a dead state, it still needs all transitions defined
.transition('q1', 'a', 'q1')
.transition('q1', 'b', 'q1')
```

### `.increment(...symbols)`

This helper is particularly useful for DFAs that count modular sequences. It wires all declared states into a circular chain — each state advances to the next on the given symbol, and the last state wraps back to the first:

```ts
import { dfa, q } from 'delta:lib'

dfa('mod-3')
  .states(...q(0, 2)) // q0, q1, q2
  .increment('a')     // q0→q1→q2→q0
```

## Validation

`.build()` throws `NFABuildError` if there are any errors. In a DFA, missing transitions that would be warnings in an NFA are promoted to errors.
