# Turing Machines

Turing Machines extend finite automata with an infinite read/write tape and a head that can move left, right, or stay. Use `tm()` for single-tape machines and `multitape(name, N)` for multi-tape variants.

## Tape vs. Alphabet

TMs distinguish between two symbol sets:

- **Input alphabet** (`.alphabet()`) — symbols that may appear in the initial input. Declared with `.alphabet()` as usual.
- **Tape alphabet** (`.tape()`) — symbols the machine may read or write, including the blank and any working symbols (e.g. markers like `X`, `Y`) but excluding the input alphabet (input alphabet automatically added)
- **Blank symbol** (`.blank()`) — a single tape symbol that represents empty cells. Must be in the tape alphabet and must **not** be in the input alphabet.

```ts
tm('name')
  .alphabet('0', '1') // input symbols
  .tape('X', '_') // tape alphabet minus the input alphabet (no need to redeclare input alphabet)
  .blank('_') // blank must already be in tape
```

Calling `.alphabet()` after `.blank()` has been set will automatically add the declared symbols to the tape alphabet as well.

## Single-Tape: `tm()`

Transitions are defined inside `.state()` scopes using `.on(read, move, toState, write?)`:

```ts
.state("q0", (s) =>
  s
    .on("0", "R", "q1")           // read "0", move right, go to q1
    .on("1", "R", "q0")           // read "1", move right, stay in q0
    .on("_", "S", "qAccept")      // read blank, stay, accept
)
```

`write` is optional — if omitted, the symbol under the head is left unchanged.

### Move Directions

| Value | Meaning           |
| ----- | ----------------- |
| `"R"` | Move head right   |
| `"L"` | Move head left    |
| `"S"` | Stay (don't move) |

## Multi-Tape: `multitape(name, N)`

Multi-tape machines operate on `N` tapes simultaneously. Transitions read one symbol from each tape and specify a write and direction per tape.

The `.on()` signature becomes tuple-based — arrays of length `N` for reads, writes, and moves:

```ts
multitape('name', 2)
  // ...
  .state(
    'q0',
    s => s.on(['0', '_'], ['R', 'S'], 'q1', ['0', '0']),
    //          ^ tape reads  --------        ----------
    //                           ^ directions ^
    //                                        ^ writes (optional)
  )
```

Read symbols can be **arrays** to match multiple possible values on a single tape in one call:

```ts
s.on([['0', '1'], '_'], ['R', 'S'], 'q0')
// matches tape 0 reading either "0" or "1", tape 1 reading blank
```

This expands into one transition per combination internally.

### `.seek(tapeIndex, skipSymbols, targetSymbol, direction, toState, ...)`

A convenience method for the common "scan until you find a symbol" pattern. It automatically generates:

- A self-loop on `fromState` while reading `skipSymbols` on `tapeIndex`
- A transition to `toState` when `targetSymbol` is found

Other tapes are held stationary (reading the blank by default, or a custom `otherTapesContext`). An optional `writeTarget` overwrites the symbol found at the target position.

## Validation

`.build()` throws `TMBuildError` on errors including undeclared states/symbols, duplicate transitions (TMs are deterministic in Delta), missing blank symbol, or tuple length mismatches.
