import { nfa } from '@delta/build'
import { describe, expect, it } from 'vitest'
import { convertToDFA } from '../src'

describe('subset construction (endsInAB)', () => {
  const endsInAB = nfa('endsInAB')
    .alphabet('a', 'b')
    .states('q0', 'q1', 'q2')
    .start('q0')
    .accept('q2')
    .transition('q0', 'a', 'q0')
    .transition('q0', 'b', 'q0')
    .transition('q0', 'a', 'q1')
    .transition('q1', 'b', 'q2')
    .build()

  const dfa = convertToDFA(endsInAB)

  describe('structure', () => {
    it('produces exactly three DFA states', () => {
      expect(dfa.states).toStrictEqual(new Set(['{q0}', '{q0,q1}', '{q0,q2}']))
    })

    it('start state is {q0}', () => {
      expect(dfa.startState).toBe('{q0}')
    })

    it('accept state is {q0,q2} only', () => {
      expect(dfa.acceptStates).toStrictEqual(new Set(['{q0,q2}']))
    })

    it('inherits the alphabet', () => {
      expect(dfa.alphabet).toStrictEqual(new Set(['a', 'b']))
    })

    it('name is endsInAB__dfa', () => {
      expect(dfa.name).toBe('endsInAB__dfa')
    })
  })

  describe('transitions', () => {
    const t = (from: string, symbol: string) =>
      dfa.transitions.get(from)?.get(symbol)

    it('{q0} on \'a\' -> {q0,q1}', () => {
      expect(t('{q0}', 'a')).toStrictEqual(new Set(['{q0,q1}']))
    })

    it('{q0} on \'b\' -> {q0}', () => {
      expect(t('{q0}', 'b')).toStrictEqual(new Set(['{q0}']))
    })

    it('{q0,q1} on \'a\' -> {q0,q1}', () => {
      expect(t('{q0,q1}', 'a')).toStrictEqual(new Set(['{q0,q1}']))
    })

    it('{q0,q1} on \'b\' -> {q0,q2}', () => {
      expect(t('{q0,q1}', 'b')).toStrictEqual(new Set(['{q0,q2}']))
    })

    it('{q0,q2} on \'a\' -> {q0,q1}', () => {
      expect(t('{q0,q2}', 'a')).toStrictEqual(new Set(['{q0,q1}']))
    })

    it('{q0,q2} on \'b\' -> {q0}', () => {
      expect(t('{q0,q2}', 'b')).toStrictEqual(new Set(['{q0}']))
    })
  })
})
