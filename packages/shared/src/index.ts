import { expect } from 'vitest'

export function getBuildError<E extends Error>(
  ErrorType: new (...args: any[]) => E,
  fn: () => void,
): E {
  try {
    fn()
    expect.fail('Expected function to throw, but it succeeded.')
  }
  catch (err) {
    expect(err).toBeInstanceOf(ErrorType)
    if (!(err instanceof ErrorType)) {
      throw err
    }
    return err
  }
}
