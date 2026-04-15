# Turing Machines

Turing Machines extend finite automata with an infinite read/write tape and a head that can move left, right, or stay. Use `tm()` for single-tape machines and `multitape(name, N)` for multi-tape variants.

## The TM Workbench

The TM workbench has two tabs: **Code** and **Debug**. (Canvas is available for NFAs only.)

### Code

Write your machine in TypeScript and import from `delta:lib`:

```ts
import { tm } from 'delta:lib'

export default tm('check balanced parens')
  // ...
  .build()
```

Compile with **Cmd+S**. Build errors appear as red underlines in the editor.

### Debug

The **Debug** tab steps through the Turing Machine's computation one transition at a time.

1. Type an input string in the field at the top (or pick one from the test suite dropdown).
2. Use the **arrow buttons** (or keyboard arrow keys) to step forward and backward.
3. The **tape display** shows a sliding window of cells centered on the current head position. The cell under the head is highlighted in lavender.
4. For multi-tape machines, each tape appears as a separate row.
5. The **transition table** below the tape lists transitions from the current state. The one currently being fired is highlighted, showing the symbol read, the symbol written, and the head direction.
6. At the end of the computation, the display shows whether the machine accepted or rejected (or halted without accepting).

Simulation runs up to `max(1000, input.length × 100)` steps before stopping. For inputs that cause very long runs, increase the input length to raise the limit automatically, or simplify the machine.

The graph panel on the right (desktop) highlights transitions on hover — useful for cross-referencing states during debugging.

## Builder API

### Tape vs. Alphabet

TMs distinguish between two symbol sets:

- **Input alphabet** (`.alphabet()`) — symbols that may appear in the initial input.
- **Tape alphabet** (`.tape()`) — additional symbols the machine may read or write, such as markers like `X` or `Y`. The input alphabet is included automatically; you only need to list extras here.
- **Blank symbol** (`.blank()`) — a single tape symbol representing empty cells. Must be in the tape alphabet and must **not** be in the input alphabet.

```ts
tm('name')
  .alphabet('0', '1')
  .tape('X', '_')
  .blank('_')
```

### Single-Tape: `tm()`

Transitions are defined inside `.state()` scopes using `.on(read, move, toState, write?)`:

```ts
.state('q0', s =>
  s
    .on('0', 'R', 'q1')       // read "0", move right, go to q1
    .on('1', 'R', 'q0')       // read "1", move right, stay in q0
    .on('_', 'S', 'qAccept')  // read blank, stay, accept
)
```

`write` is optional — if omitted, the symbol under the head is left unchanged.

### Move Directions

| Value | Meaning         |
| ----- | --------------- |
| `"R"` | Move head right |
| `"L"` | Move head left  |
| `"S"` | Stay            |

### Multi-Tape: `multitape(name, N)`

Multi-tape machines operate on `N` tapes simultaneously. Transitions read one symbol from each tape and specify a write and direction per tape.

The `.on()` signature becomes tuple-based — arrays of length `N` for reads, writes, and moves:

```ts
multitape('name', 2)
  .state(
    'q0',
    s => s.on(['0', '_'], ['R', 'S'], 'q1', ['0', '0']),
    //          ^ tape reads   ^ dirs              ^ writes (optional)
  )
```

Read symbols can be **arrays** to match multiple values on a single tape in one call:

```ts
s.on([['0', '1'], '_'], ['R', 'S'], 'q0')
// matches tape 0 reading either "0" or "1", tape 1 reading blank
```

This expands into one transition per combination internally.

### `.seek(tapeIndex, skipSymbols, targetSymbol, direction, toState, ...)`

A convenience method for the common "scan until you find a symbol" pattern. It generates:

- A self-loop on the current state while reading `skipSymbols` on `tapeIndex`
- A transition to `toState` when `targetSymbol` is found

Other tapes are held stationary. An optional `writeTarget` overwrites the symbol found at the target position.

### Validation

`.build()` throws `TMBuildError` on errors including undeclared states or symbols, duplicate transitions (TMs in Delta are deterministic), missing blank symbol, or tuple length mismatches in multi-tape definitions.
