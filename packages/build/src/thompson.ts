import type { NFA } from './nfa'
import { char, concat, epsilon, star, union } from './helpers'
import { UnexpectedStackError } from './UnexpectedStackError'

/**
 * Stack-based builder for composing NFAs using Thompson's construction.
 *
 * Operations push and pop `NFA` objects on an internal stack:
 * - Leaf operations (`char`, `eps`, `machine`) **push** one NFA.
 * - Binary operations (`union`, `concat`) **pop** two NFAs and push one.
 * - The unary `star` operation **pops** one NFA and pushes one.
 *
 * Call `build()` when exactly one NFA remains on the stack to retrieve
 * the final machine.
 *
 * Use the top-level `thompson(name)` factory instead of instantiating this
 * class directly.
 *
 * @example
 * // Builds an NFA for the regular expression (a|b)*c
 * const machine = thompson('(a|b)*c')
 *   .char('a')
 *   .char('b')
 *   .union()   // (a|b)
 *   .star()    // (a|b)*
 *   .char('c')
 *   .concat()  // (a|b)*c
 *   .build()
 */
class ThompsonBuilder {
  private stack: NFA[] = []
  private readonly _name: string

  constructor(name: string) {
    this._name = name
  }

  /**
   * Push an NFA that accepts exactly the single character `s`.
   *
   * @param s - The character to match.
   * @returns This builder for chaining.
   *
   * @example
   * thompson('a').char('a').build() // accepts "a"
   */
  public char(s: string): this {
    this.stack.push(char(s))
    return this
  }

  /**
   * Push an already-built `NFA` onto the stack.
   *
   * Useful when you want to compose a previously constructed machine into
   * a larger Thompson expression.
   *
   * @param nfa - The NFA to push.
   * @returns This builder for chaining.
   */
  public machine(nfa: NFA): this {
    this.stack.push(nfa)
    return this
  }

  /**
   * Push an NFA that accepts the empty string (ε).
   *
   * @returns This builder for chaining.
   *
   * @example
   * // Accepts "" or "a"
   * thompson('a?').eps().char('a').union().build()
   */
  public eps(): this {
    this.stack.push(epsilon())
    return this
  }

  /**
   * Pop the top two NFAs and push their union (alternation).
   *
   * Corresponds to the `|` operator in regular expressions.
   * The result accepts any string accepted by either operand.
   *
   * @returns This builder for chaining.
   * @throws `UnexpectedStackError` if fewer than two NFAs are on the stack.
   *
   * @example
   * thompson('a|b').char('a').char('b').union().build()
   */
  public union(): this {
    if (this.stack.length < 2) {
      throw new UnexpectedStackError(this.stack.length, 2, 'union')
    }
    const b = this.stack.pop()!
    const a = this.stack.pop()!
    this.stack.push(union(a, b))
    return this
  }

  /**
   * Pop the top two NFAs and push their concatenation.
   *
   * The second-to-top NFA becomes the prefix; the top NFA becomes the suffix.
   * The result accepts strings `xy` where `x` is in the first language and
   * `y` is in the second.
   *
   * @returns This builder for chaining.
   * @throws `UnexpectedStackError` if fewer than two NFAs are on the stack.
   *
   * @example
   * thompson('ab').char('a').char('b').concat().build()
   */
  public concat(): this {
    if (this.stack.length < 2) {
      throw new UnexpectedStackError(this.stack.length, 2, 'concat')
    }
    const b = this.stack.pop()!
    const a = this.stack.pop()!
    this.stack.push(concat(a, b))
    return this
  }

  /**
   * Pop the top NFA and push its Kleene star.
   *
   * The result accepts zero or more repetitions of any string in the
   * original language, including the empty string.
   *
   * @returns This builder for chaining.
   * @throws `UnexpectedStackError` if the stack is empty.
   *
   * @example
   * thompson('a*').char('a').star().build()
   */
  public star(): this {
    if (this.stack.length < 1) {
      throw new UnexpectedStackError(this.stack.length, 1, 'star')
    }
    const a = this.stack.pop()!
    this.stack.push(star(a))
    return this
  }

  /**
   * Finalise the builder and return the composed NFA.
   *
   * The stack must contain exactly one NFA at this point. If it contains
   * more or fewer, the construction is incomplete or has a mistake.
   *
   * @returns The final `NFA` with the name supplied to `thompson()`.
   * @throws `UnexpectedStackError` if the stack does not have exactly one NFA.
   *
   * @example
   * const machine = thompson('(a|b)*')
   *   .char('a').char('b').union().star()
   *   .build()
   */
  public build(): NFA {
    if (this.stack.length !== 1) {
      // Build requires exactly 1 machine representing the final NFA
      throw new UnexpectedStackError(this.stack.length, 1, 'build')
    }
    return { ...this.stack[0], name: this._name }
  }
}

/**
 * Create a stack-based Thompson NFA builder.
 *
 * Leaf operations (`char`, `eps`, `machine`) push NFAs onto an internal stack.
 * Combinator operations (`union`, `concat`, `star`) pop operands and push the
 * resulting composed NFA. Call `build()` when one NFA remains.
 *
 * @param name - Label assigned to the final NFA.
 * @returns A fresh `ThompsonBuilder`.
 *
 * @example
 * // Builds (a|b)*c
 * const machine = thompson('(a|b)*c')
 *   .char('a')
 *   .char('b')
 *   .union()
 *   .star()
 *   .char('c')
 *   .concat()
 *   .build()
 */
export default function thompson(name: string): ThompsonBuilder {
  return new ThompsonBuilder(name)
}
