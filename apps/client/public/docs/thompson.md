# Thompson's Construction

`thompson()` builds NFAs from regular expressions using a postfix stack-based approach. Instead of wiring states manually, you push primitive machines onto a stack and combine them with operators — exactly the way Thompson's construction algorithm works on paper.

## How It Works

The builder maintains an internal stack of NFA fragments. Primitive operations push a new fragment; combining operations pop fragments, merge them, and push the result. `.build()` pops the final (only remaining) fragment and returns it as an NFA.

```ts
import { thompson } from 'delta:lib'

const machine = thompson('name')
  // push primitives...
  // apply operators...
  .build()
```

## Primitives

| Method          | Pushes                                                           |
| --------------- | ---------------------------------------------------------------- |
| `.char(s)`      | A two-state NFA accepting exactly the single character `s`       |
| `.eps()`        | A two-state NFA accepting the empty string (ε)                   |
| `.machine(nfa)` | An existing `NFA` object (useful for composing pre-built machines) |

## Operators

Each operator pops one or two fragments from the stack and pushes the combined result.

| Method      | Pops | Result                                                           |
| ----------- | ---- | ---------------------------------------------------------------- |
| `.union()`  | 2    | Accepts strings accepted by **either** fragment (A \| B)         |
| `.concat()` | 2    | Accepts strings formed by **concatenating** the two fragments (AB) |
| `.star()`   | 1    | Accepts **zero or more** repetitions of the fragment (A\*)       |

The order matters for binary operators: the **first pushed** fragment is the left operand.

## Stack Discipline

The stack must have exactly **one** fragment remaining when `.build()` is called. Too few elements for an operator, or leftover fragments at build time, throw an `UnexpectedStackError`.

| Regex      | Builder calls                                            |
| ---------- | -------------------------------------------------------- |
| `ab`       | `.char("a").char("b").concat()`                          |
| `a\|b`     | `.char("a").char("b").union()`                           |
| `a*`       | `.char("a").star()`                                      |
| `(ab)*`    | `.char("a").char("b").concat().star()`                   |
| `a*(b\|c)` | `.char("a").star().char("b").char("c").union().concat()` |

## Composing Machines

`.machine(nfa)` lets you push a fully built NFA as a sub-expression. Build each clause separately, then combine them:

```ts
const clause1 = thompson('A')./* ... */.build()
const clause2 = thompson('B')./* ... */.build()

const combined = thompson('A | B')
  .machine(clause1)
  .machine(clause2)
  .union()
  .build()
```

State names in composed machines are automatically renumbered to avoid collisions.

## Converting to a DFA

The output of `thompson()` is always an ε-NFA. To obtain a deterministic machine, use `convertToDFA` — also available from `delta:lib`:

```ts
import { thompson, convertToDFA } from 'delta:lib'

const nfaMachine = thompson('name')./* ... */.build()
const dfaMachine = convertToDFA(nfaMachine, { name: 'my DFA', preserveNames: false })

export default dfaMachine
```
