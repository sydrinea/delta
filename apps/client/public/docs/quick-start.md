# Quick Start

Delta is a browser-based workbench for building and simulating formal automata. You write machines as TypeScript, compile them in the editor, and interact with them through a visual debugger and test suite — no local setup required.

## Importing from `delta:lib`

All builders and utilities are available from a single virtual module:

```ts
import { nfa, dfa, tm, multitape, thompson, EPS, q, convertToDFA } from 'delta:lib'
```

This is the only import you need. `delta:lib` is resolved automatically by the workbench — you don't install anything.

## Writing a Machine

Every machine is built with a fluent builder, then returned as the file's default export. The workbench reads the default export and uses it for simulation and visualization.

```ts
import { dfa } from 'delta:lib'

export default dfa('even number of 1s')
  .alphabet('0', '1')
  .states('q0', 'q1')
  .start('q0')
  .accept('q0')
  .transition('q0', '0', 'q0')
  .transition('q0', '1', 'q1')
  .transition('q1', '0', 'q1')
  .transition('q1', '1', 'q0')
  .build()
```

A missing `export default`, or a build error thrown by `.build()`, will be surfaced as a compile error.

## The Editor

The **Code** tab contains a Monaco editor with full TypeScript support. Autocomplete and type checking work against the `delta:lib` types as you type.

**Cmd+S** (or the **compile** button) compiles your code and updates the visualization. The status indicator in the header shows:

- `✓ valid` — machine compiled and is ready
- `✗ check errors` — one or more errors; red underlines in the editor show exactly where, with hover tooltips giving details

## Recipes

The dropdown in the header lists pre-built example machines. Selecting one loads its code into the editor and populates the test suite with relevant inputs. It's a good way to explore language patterns or start from a working baseline.

## Sharing

The **share** button (icon next to the machine name) copies a URL that encodes the current machine code. Anyone who opens the link lands directly in the workbench with your machine loaded.

## Graph

On desktop, the right panel always shows a Graphviz diagram of the compiled machine. You can export it as **PNG**, **SVG**, or raw **DOT** source using the actions in the graph header.

## Tests

The **Tests** panel (right sidebar on desktop; **Tests** tab on mobile) lets you define a set of input strings and check whether the machine accepts or rejects each one.

| Shortcut        | Action          |
| --------------- | --------------- |
| Shift+Cmd+T     | Run all tests   |
| Shift+Cmd+R     | Reset results   |

You can also import and export test cases as JSON.

## Helper: `q(lower, upper)`

Generates sequential state names `["q0", "q1", ..., "qN"]`:

```ts
import { q } from 'delta:lib'

builder.states(...q(0, 7)) // → "q0" through "q7"
```
