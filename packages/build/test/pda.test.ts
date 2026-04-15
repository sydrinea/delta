import { getBuildError } from '@delta/shared'
import { describe, expect, it } from 'vitest'
import { EPS, EPSILON, pda, PDABuildError, PDAMessages, pdaTransitionKey } from '../src'

// Minimal valid PDA used as a base for many tests
function validPDA() {
  return pda('a-n-b-n')
    .alphabet('a', 'b')
    .states('q0', 'q1', 'q2')
    .stackAlphabet('Z', 'A')
    .initialStack('Z')
    .start('q0')
    .accept('q2')
    .transition('q0', 'a', 'Z', ['A', 'Z'], 'q0')
    .transition('q0', 'a', 'A', ['A', 'A'], 'q0')
    .transition('q0', 'b', 'A', [], 'q1')
    .transition('q1', 'b', 'A', [], 'q1')
    .transition('q1', EPSILON, 'Z', ['Z'], 'q2')
}

describe('pDABuilder', () => {
  describe('valid construction', () => {
    it('builds a valid PDA with no messages', () => {
      const m = validPDA().build()

      expect(m.messages).toHaveLength(0)
      expect(m.startState).toBe('q0')
      expect([...m.acceptStates]).toStrictEqual(['q2'])
      expect(m.initialStackSymbol).toBe('Z')
      expect(m.stackAlphabet).toStrictEqual(new Set(['Z', 'A']))
    })

    it('stores correct transition structure', () => {
      const m = validPDA().build()

      const q0Map = m.transitions.get('q0')
      expect(q0Map).toBeDefined()

      const pushOnZ = q0Map!.get(pdaTransitionKey('a', 'Z'))
      expect(pushOnZ).toStrictEqual({
        toState: 'q0',
        inputSymbol: 'a',
        stackPop: 'Z',
        stackPush: ['A', 'Z'],
      })

      const popOnB = q0Map!.get(pdaTransitionKey('b', 'A'))
      expect(popOnB).toStrictEqual({
        toState: 'q1',
        inputSymbol: 'b',
        stackPop: 'A',
        stackPush: [],
      })
    })

    it('allows epsilon input transitions', () => {
      const m = validPDA().build()

      const q1Map = m.transitions.get('q1')
      const epsTrans = q1Map!.get(pdaTransitionKey(EPSILON, 'Z'))
      expect(epsTrans).toStrictEqual({
        toState: 'q2',
        inputSymbol: EPSILON,
        stackPop: 'Z',
        stackPush: ['Z'],
      })
    })

    it('allows epsilon pop (peek) transitions', () => {
      const m = pda('peek')
        .alphabet('a')
        .states('q0', 'q1')
        .stackAlphabet('Z')
        .initialStack('Z')
        .start('q0')
        .accept('q1')
        .transition('q0', 'a', EPSILON, [], 'q1')
        .build()

      const trans = m.transitions.get('q0')!.get(pdaTransitionKey('a', EPSILON))
      expect(trans?.stackPop).toBe(EPSILON)
      expect(trans?.stackPush).toStrictEqual([])
    })

    it('builds via state() scoped proxy', () => {
      const m = pda('scoped')
        .alphabet('a', 'b')
        .states('q0', 'q1', 'q2')
        .stackAlphabet('Z', 'A')
        .initialStack('Z')
        .start('q0')
        .accept('q2')
        .state('q0')
        .on('a', 'Z', ['A', 'Z'], 'q0')
        .on('a', 'A', ['A', 'A'], 'q0')
        .on('b', 'A', [], 'q1')
        .done()
        .state('q1')
        .on('b', 'A', [], 'q1')
        .on(EPSILON, 'Z', ['Z'], 'q2')
        .done()
        .build()

      expect(m.messages).toHaveLength(0)
      expect(m.transitions.get('q0')?.get(pdaTransitionKey('a', 'Z'))).toMatchObject({
        toState: 'q0',
        stackPush: ['A', 'Z'],
      })
    })
  })

  describe('build()', () => {
    it('throws if called twice', () => {
      const builder = validPDA()
      builder.build()
      expect(() => builder.build()).toThrow(PDAMessages.alreadyBuilt)
    })

    it('throws if no start state defined', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .accept('q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.noStartState,
        }),
      )
    })

    it('throws if no initial stack symbol defined', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .start('q0')
          .accept('q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.noInitialStackSymbol,
        }),
      )
    })
  })

  describe('start()', () => {
    it('throws if start state not declared', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q99')
          .accept('q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.startStateNotDeclared('q99'),
        }),
      )
    })
  })

  describe('accept()', () => {
    it('throws if accept state not declared', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q0')
          .accept('q99')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.acceptStateNotDeclared('q99'),
        }),
      )
    })
  })

  describe('alphabet()', () => {
    it('throws if epsilon is included in the input alphabet', () => {
      const builder = pda('test')
        .alphabet('a', EPS)
        .states('q0')
        .stackAlphabet('Z')
        .initialStack('Z')
        .start('q0')
        .accept('q0')

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.epsilonInAlphabet,
        }),
      )

      const err = getBuildError(PDABuildError, () => builder.build())
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.epsilonInAlphabet,
        }),
      )
    })
  })

  describe('stackAlphabet()', () => {
    it('throws if epsilon is included in the stack alphabet', () => {
      const builder = pda('test')
        .alphabet('a')
        .states('q0')
        .stackAlphabet('Z', EPS)
        .initialStack('Z')
        .start('q0')
        .accept('q0')

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.epsilonInStackAlphabet,
        }),
      )
    })
  })

  describe('initialStack()', () => {
    it('throws if initial stack symbol not in stack alphabet', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('X')
          .start('q0')
          .accept('q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.initialStackSymbolNotInStackAlphabet('X'),
        }),
      )
    })
  })

  describe('transition()', () => {
    it('throws if from state not declared', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q0')
          .accept('q0')
          .transition('q99', 'a', 'Z', ['Z'], 'q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.transitionSourceNotDeclared('q99'),
        }),
      )
    })

    it('throws if to state not declared', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q0')
          .accept('q0')
          .transition('q0', 'a', 'Z', ['Z'], 'q99')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.transitionTargetNotDeclared('q99'),
        }),
      )
    })

    it('warns if input symbol not in alphabet', () => {
      const m = pda('test')
        .alphabet('a')
        .states('q0')
        .stackAlphabet('Z')
        .initialStack('Z')
        .start('q0')
        .accept('q0')
        .transition('q0', 'a', 'Z', ['Z'], 'q0') // valid, keeps build from erroring
        .transition('q0', 'x', 'Z', ['Z'], 'q0') // invalid symbol: warning only
        .build()

      expect(m.messages).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          content: PDAMessages.transitionSymbolNotInAlphabet('x'),
        }),
      )
    })

    it('throws if stack pop symbol not in stack alphabet', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q0')
          .accept('q0')
          .transition('q0', 'a', 'X', ['Z'], 'q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.stackPopNotInStackAlphabet('X'),
        }),
      )
    })

    it('throws if a stack push symbol not in stack alphabet', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q0')
          .accept('q0')
          .transition('q0', 'a', 'Z', ['Z', 'X'], 'q0')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.stackPushNotInStackAlphabet('X'),
        }),
      )
    })

    it('throws on duplicate (from, input, pop) key', () => {
      const err = getBuildError(PDABuildError, () =>
        pda('test')
          .alphabet('a')
          .states('q0', 'q1')
          .stackAlphabet('Z')
          .initialStack('Z')
          .start('q0')
          .accept('q1')
          .transition('q0', 'a', 'Z', ['Z'], 'q0')
          .transition('q0', 'a', 'Z', ['Z'], 'q1')
          .build())

      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.duplicateTransition('q0', 'a', 'Z'),
        }),
      )
    })

    it('skips invalid transition but continues building', () => {
      const m = pda('test')
        .alphabet('a', 'b')
        .states('q0', 'q1')
        .stackAlphabet('Z', 'A')
        .initialStack('Z')
        .start('q0')
        .accept('q1')
        .transition('q0', 'x', 'Z', ['Z'], 'q0') // invalid: 'x' not in alphabet
        .transition('q0', 'a', 'Z', ['A', 'Z'], 'q0')
        .transition('q0', EPSILON, 'Z', ['Z'], 'q1')
        .build()

      // Invalid transition was not inserted
      expect(m.transitions.get('q0')?.has(pdaTransitionKey('x', 'Z'))).toBe(false)
      // Valid transition was inserted
      expect(m.transitions.get('q0')?.has(pdaTransitionKey('a', 'Z'))).toBe(true)
    })

    it('accumulates multiple transition errors', () => {
      const builder = pda('test')
        .alphabet('a')
        .states('q0')
        .stackAlphabet('Z')
        .initialStack('Z')
        .start('q0')
        .accept('q0')
        .transition('q99', 'a', 'Z', ['Z'], 'q0')
        .transition('q0', 'a', 'Z', ['Z'], 'q99')

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.transitionSourceNotDeclared('q99'),
        }),
      )
      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.transitionTargetNotDeclared('q99'),
        }),
      )
    })
  })

  describe('messages getter', () => {
    it('exposes messages before build()', () => {
      const builder = pda('test')
        .alphabet('a')
        .states('q0')
        .stackAlphabet('Z')
        .initialStack('Z')
        .start('q99')

      expect(builder.messages).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          content: PDAMessages.startStateNotDeclared('q99'),
        }),
      )
    })
  })
})
