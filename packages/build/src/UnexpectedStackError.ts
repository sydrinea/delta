/**
 * Thrown when a ThompsonBuilder operation lacks the required number of NFA machines on the stack.
 */
export class UnexpectedStackError extends Error {
  public actual: number
  public expected: number
  public operation: string

  constructor(actual: number, expected: number, operation: string) {
    super(
      `Thompson build failed in '${operation}': expected ${expected} machine(s) on stack, found ${actual}`,
    )
    this.name = 'UnexpectedStackError'
    this.actual = actual
    this.expected = expected
    this.operation = operation

    // Fix prototype chain for built-in Error extension in TypeScript
    Object.setPrototypeOf(this, UnexpectedStackError.prototype)
  }

  /**
   * Returns a cleanly formatted string representation of the error for logging.
   */
  public toString(): string {
    return `[${this.name}] Operation '${this.operation}' failed: expected ${this.expected} NFA(s) on the stack, but found ${this.actual}.`
  }
}
