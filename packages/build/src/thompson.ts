import { NFA } from "./nfa";
import { char, epsilon, union, concat, star } from "./helpers";
import { UnexpectedStackError } from "./UnexpectedStackError";

class ThompsonBuilder {
  private stack: NFA[] = [];
  private readonly _name: string;

  constructor(name: string) {
    this._name = name;
  }

  public char(s: string): this {
    this.stack.push(char(s));
    return this;
  }

  public machine(nfa: NFA): this {
    this.stack.push(nfa);
    return this;
  }

  public eps(): this {
    this.stack.push(epsilon());
    return this;
  }

  public union(): this {
    if (this.stack.length < 2) {
      throw new UnexpectedStackError(this.stack.length, 2, "union");
    }
    const b = this.stack.pop()!;
    const a = this.stack.pop()!;
    this.stack.push(union(a, b));
    return this;
  }

  public concat(): this {
    if (this.stack.length < 2) {
      throw new UnexpectedStackError(this.stack.length, 2, "concat");
    }
    const b = this.stack.pop()!;
    const a = this.stack.pop()!;
    this.stack.push(concat(a, b));
    return this;
  }

  public star(): this {
    if (this.stack.length < 1) {
      throw new UnexpectedStackError(this.stack.length, 1, "star");
    }
    const a = this.stack.pop()!;
    this.stack.push(star(a));
    return this;
  }

  public build(): NFA {
    if (this.stack.length !== 1) {
      // Build requires exactly 1 machine representing the final NFA
      throw new UnexpectedStackError(this.stack.length, 1, "build");
    }
    return { ...this.stack[0], name: this._name };
  }
}

export default function thompson(name: string): ThompsonBuilder {
  return new ThompsonBuilder(name);
}
