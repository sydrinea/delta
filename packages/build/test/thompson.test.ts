import { describe, expect, it } from 'vitest'
import { thompson, UnexpectedStackError } from '../src'

describe('thompson (non-happy path)', () => {
  it('throws UnexpectedStackError on union with < 2 machines', () => {
    // 0 machines
    expect(() => thompson('t').union()).toThrow(UnexpectedStackError)
    // 1 machine
    expect(() => thompson('t').char('a').union()).toThrow(UnexpectedStackError)
  })

  it('throws UnexpectedStackError on concat with < 2 machines', () => {
    expect(() => thompson('t').concat()).toThrow(UnexpectedStackError)
    expect(() => thompson('t').char('a').concat()).toThrow(
      UnexpectedStackError,
    )
  })

  it('throws UnexpectedStackError on star with < 1 machine', () => {
    expect(() => thompson('t').star()).toThrow(UnexpectedStackError)
  })

  it('throws UnexpectedStackError on build with != 1 machine', () => {
    // 0 machines
    expect(() => thompson('t').build()).toThrow(UnexpectedStackError)
    // 2 machines
    expect(() => thompson('t').char('a').char('b').build()).toThrow(
      UnexpectedStackError,
    )
  })

  it('unexpectedStackError yields correct formatting via toString', () => {
    const err = new UnexpectedStackError(0, 2, 'union')
    expect(err.toString()).toBe(
      '[UnexpectedStackError] Operation \'union\' failed: expected 2 NFA(s) on the stack, but found 0.',
    )
    expect(err.actual).toBe(0)
    expect(err.expected).toBe(2)
    expect(err.operation).toBe('union')
  })
})
