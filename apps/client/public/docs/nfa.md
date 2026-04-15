# NFAs

Nondeterministic Finite Automata allow multiple transitions on the same symbol and epsilon (ε) transitions — moves that consume no input.

## The NFA Workbench

The NFA workbench has three tabs: **Code**, **Canvas**, and **Debug**.

### Code

Write your machine in TypeScript and import from `delta:lib`:

```ts
import { nfa, EPS } from 'delta:lib'

export default nfa('ends in 01')
  .alphabet('0', '1')
  .states('q0', 'q1', 'q2')
  .start('q0')
  .accept('q2')
  .transition('q0', '0', 'q0')
  .transition('q0', '1', 'q0')
  .transition('q0', '0', 'q1')
  .transition('q1', '1', 'q2')
  .build()
```

Compile with **Cmd+S**. Build errors (undeclared states, unknown symbols) appear as red underlines with hover details.

### Canvas

The **Canvas** tab is a visual drag-and-drop editor. You can draw states and transitions directly on the graph instead of writing code.

Switching from **Code** to **Canvas** converts your current machine into a graph. If your code contains comments, helper methods like `.bounce()` or `.batch()`, or any logic beyond basic `.transition()` calls, you'll be prompted before converting — the canvas represents the machine as bare transitions only, so that structure will be lost.

Switching back from **Canvas** to **Code** regenerates TypeScript from the graph state.

### Debug

The **Debug** tab lets you step through the NFA's computation on a given input.

1. Type an input string in the field at the top (or pick one from the test suite dropdown).
2. Use the **arrow buttons** (or keyboard arrow keys) to step forward and backward.
3. The input display shows a sliding window of symbols centered on the current read position. The active symbol is highlighted in lavender; already-consumed symbols are dimmed.
4. The **configuration table** below the input shows the set of active states at each step. When the machine reaches the end of input, the table shows whether the run accepted or rejected.
5. On desktop, the graph panel on the right highlights the active transitions as you step through.

## Builder API

### Basic Structure

```ts
import { nfa, EPS } from 'delta:lib'

const machine = nfa('name')
  .alphabet('0', '1')
  .states('q0', 'q1', 'q2')
  .start('q0')
  .accept('q2')
  // transitions...
  .build()
```

The alphabet must not include `EPS` — epsilon is a reserved symbol used only in transition calls.

### `.transition(from, symbol, to)`

The core transition method. Unlike a DFA, you can add multiple transitions from the same state on the same symbol, and the machine will explore all of them nondeterministically.

**Epsilon transitions** use the `EPS` constant as the symbol:

```ts
.transition('q0', EPS, 'q1')  // ε-transition: no input consumed
```

### Shorthand Methods

| Method                        | Behavior                                                                    |
| ----------------------------- | --------------------------------------------------------------------------- |
| `.loop(state, ...symbols)`    | Self-transition on the given symbols                                        |
| `.bounce(a, there, b, back?)` | Bidirectional transition; `back` defaults to `there`                        |
| `.plus(from, symbol, to)`     | Transition from→to, plus a self-loop on `to` ("one or more")               |
| `.star(from, symbol, to)`     | Self-loop on `from`, transition to `to`, self-loop on `to` ("zero or more") |
| `.increment(...symbols)`      | Advance through all declared states in order on each symbol, wrapping around |

### State Scoping

`.state(stateName)` returns a `StateProxy` that scopes transitions to a single state:

```ts
builder
  .state('q0')
  .loop('a')      // q0 --a--> q0
  .to('q1', 'b')  // q0 --b--> q1
  .done()         // return to builder
```

### Bulk Transitions

`.batch(filter, apply)` and `.all(apply)` apply a transition pattern across multiple states at once:

```ts
// Loop on "0" in every state whose name starts with "q"
builder.batch(
  s => s.startsWith('q'),
  proxy => proxy.loop('0'),
)

// Apply to every state
builder.all(proxy => proxy.loop('b'))
```

### Validation

`.build()` throws `NFABuildError` if there are errors (undeclared states, unknown symbols). Missing transitions for declared symbols produce warnings instead of errors.
