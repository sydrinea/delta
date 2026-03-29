<div align="center">

<img src="https://delta.sydneyn.dev/android-chrome-512x512.png" width="96" alt="Delta logo" />

# Delta

**An interactive, code-first environment to design, test, and visualize automata**

[![Live App](https://img.shields.io/badge/try%20it-delta.sydneyn.dev-blue?style=flat-square)](https://delta.sydneyn.dev)
&nbsp;
[![Demo](https://img.shields.io/badge/watch-demo-red?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=zOM9aVSUVi0)

</div>

---

Delta lets you define DFAs, NFAs, and Turing Machines as TypeScript code using a readable fluent API, then immediately run test suites against them, visualize execution, and share your work with a URL.

## Getting Started

No setup required: **[delta.sydneyn.dev](https://delta.sydneyn.dev)**

To run it locally:

```bash
git clone https://github.com/sydrinea/delta
cd delta
pnpm install
pnpm run dev
```

> **Note:** `@delta/build` is not yet published to npm. It's available as a workspace package within this monorepo.

## Features

### Declarative Fluent API

Machines are defined in code using `@delta/build`, a chainable builder library. DFAs, NFAs, and Turing Machines each have their own builder with validation baked in — errors surface at build time, not at runtime.

```ts
import { nfa } from "@delta/build";

const machine = nfa("ends in ab")
  .alphabet("a", "b")
  .states("q0", "q1", "q2")
  .start("q0")
  .accept("q2")
  .transition("q0", "a", "q0")
  .transition("q0", "b", "q0")
  .transition("q0", "a", "q1")
  .transition("q1", "b", "q2")
  .build();
```

### Integrated Test Suites

Pair any machine with a test suite. Delta runs them all and reports pass/fail inline.

### Thompson's Construction

A stack-based API for building NFAs from regular expressions using union, concatenation, and Kleene star — directly mirroring Thompson's construction.

### Subset Construction (NFA → DFA)

Convert any NFA to an equivalent DFA via `convertToDFA` from `@delta/transform`, with an option to preserve human-readable state names.

```ts
import { convertToDFA } from "@delta/transform";

const deterministic = convertToDFA(myNFA, {
  name: "my DFA",
  preserveNames: false,
});
```

### Shareable URLs

Every machine and its state can be encoded into a URL, so you can save your work or send it to someone without any accounts or exports.

## Documentation

| Guide                                       | Description                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| [Quick Start](docs/quick-start.md)          | Builder lifecycle, shared methods, and the `q()` helper                  |
| [NFAs](docs/nfa.md)                         | Epsilon transitions, shorthand methods, state scoping, batch transitions |
| [DFAs](docs/dfa.md)                         | Determinism constraints, total transition function, `.increment()`       |
| [Turing Machines](docs/tm.md)               | Tape alphabet, single-tape and multi-tape builders, `.seek()`            |
| [Thompson's Construction](docs/thompson.md) | Stack model, primitives, operators, machine composition                  |

Also be sure to check out the examples [for NFAs](/examples/src/nfa) and [for Turing Machines](/examples/src/tm).

## Roadmap

- [ ] PDAs
- [ ] Regular Grammars
- [ ] Context-Free Grammars

## License

[MIT](LICENSE)
