<div align="center">
  <img src="https://delta.sydneyn.dev/android-chrome-512x512.png" width="64" alt="Delta logo" />
  <h1>Delta</h1>
  <p>An interactive, code-first environment to design, test, and visualize automata<p>

[![Live App](https://img.shields.io/badge/try%20it-delta.sydneyn.dev-blueviolet?style=flat-square)](https://delta.sydneyn.dev)
[![Demo](https://img.shields.io/badge/watch-demo-red?style=flat-square)](https://www.youtube.com/watch?v=zOM9aVSUVi0)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## Getting started

No setup required: **[delta.sydneyn.dev](https://delta.sydneyn.dev)**

```bash
git clone https://github.com/sydrinea/delta
cd delta
pnpm install
pnpm run dev
```

> `@delta/build` is not yet published to npm. It's available as a workspace package within this monorepo.

## Features

**Fluent API** — Define DFAs, NFAs, and Turing machines as TypeScript using a chainable builder. Errors surface at build time, not at runtime.

**Test suites** — Pair any machine with a test suite. Delta runs them all and reports pass/fail inline.

**NFA → DFA** — Convert any NFA to an equivalent DFA via subset construction, with an option to preserve human-readable state names.

**Thompson's construction** — Build NFAs from regular expressions using a stack-based API mirroring union, concatenation, and Kleene star.

**Shareable URLs** — Every machine encodes into a URL. No accounts or exports needed.

## Documentation

Guides for NFAs, DFAs, Turing machines, and Thompson's construction are at [preview.delta.sydneyn.dev/guide](https://preview.delta.sydneyn.dev/guide).

## Roadmap

- [ ] PDAs
- [ ] Regular grammars
- [ ] Context-free grammars

---

[MIT license](LICENSE)
