# Delta

Delta is a interactive automata engine that runs in your browser, providing real-time visual syncing, live traces, and batch testing to prove your DFAs, NFAs, PDAs, and Turing Machines actually work.

## Core Features

- **Visual Builder:** Drag, drop, and connect states on an infinite canvas.
- **Live Code Sync:** Every visual change you make instantly compiles into a formal mathematical definition in the built-in editor.
- **Programmatic API:** For massive or complex languages, skip the drawing. Define your states, alphabets, and transitions entirely in TypeScript, and Delta will auto-generate the visual graph for you.
- **Instant Simulator:** Run strings through your machine and trace exactly which states they hit step-by-step.
- **Batch Testing:** Build a suite of passing and failing test cases to verify your homework logic in milliseconds.

## Quick Start

### Building Visually

1. Click `+ state` to add a new node to the canvas.
2. Click `toggle accept` or `set start` to define your machine's parameters.
3. Drag from the edge of one state to another to create a transition.
4. Double-click the transition label to change its accepted symbol (use `ε` for epsilon transitions).

### Building with Code

For complex problems (like unions or closures), drawing gets messy. Jump into the code editor and use the fluent API:

```typescript
const machine = Delta.nfa("the language 0(00)* union Σ*11")
  .alphabet("0", "1")
  .states("q0", "Oven", "Odd", "trap", "junk", "solo", "aces")
  .start("q0")
  .accept("Odd", "aces")
  .transition("q0", Delta.EPS, "Oven")
  .transition("q0", Delta.EPS, "junk")
  .bounce("Oven", "0", "Odd")
  .bounce("junk", "1", "solo", "0")
  .plus("solo", "1", "aces")
  .plus("Odd", "1", "trap")
  .batch(
    (s) => ["trap", "junk"].includes(s),
    (s) => s.loop("0"),
  )
  .transition("aces", "0", "junk")
  .transition("Oven", "1", "trap")
  .build();
```
