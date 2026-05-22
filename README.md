<div align="center">
  <img src="https://delta.sydneyn.dev/android-chrome-512x512.png" width="64" alt="Delta logo" />
  <h1>Delta</h1>
  <p>A code-first environment for building and testing finite automata and Turing machines in TypeScript</p>

[![Live App](https://img.shields.io/badge/try%20it-comptheory.tools-blueviolet?style=flat-square)](https://comptheory.tools)
[![Demo](https://img.shields.io/badge/watch-demo-red?style=flat-square)](https://www.youtube.com/watch?v=zOM9aVSUVi0)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

---

No setup required: **[comptheory.tools](https://comptheory.tools)**

## What you can build

**NFA & DFA** — Define machines with a fluent TypeScript API. Errors surface at build time. Convert any NFA to an equivalent DFA via subset construction, with human-readable state names preserved.

**PDA** — Pushdown automata with full stack visualization. Watch each push and pop in real time as your machine processes input.

**Turing machines** — Single and multitape machines with a step-through visualizer that highlights the active transition at every step.

**Thompson's construction** — Build NFAs from regular expressions using a stack-based API mirroring union, concatenation, and Kleene star.

## Testing

Pair any machine with a test suite and Delta runs them all inline — correctness is verifiable, not just visually convincing.

## Sharing

Every machine encodes into a URL. No accounts, no exports, no hoops.

## Local development

```bash
git clone https://github.com/sydrinea/delta
cd delta
pnpm install
pnpm run dev
```

> `@delta/build` is not yet published to npm. It's available as a workspace package within this monorepo.

---

[MIT license](LICENSE)
