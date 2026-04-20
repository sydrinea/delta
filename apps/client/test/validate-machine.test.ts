import { describe, expect, it } from 'vitest'
import { validateMachine } from '@/lib/validate-machine'

const validNFA = {
  name: 'test-nfa',
  alphabet: new Set(['a', 'b']),
  states: new Set(['q0', 'q1']),
  startState: 'q0',
  acceptStates: new Set(['q1']),
  transitions: new Map([
    ['q0', new Map([['a', new Set(['q1'])]])],
  ]),
  messages: [],
}

const validPDA = {
  name: 'test-pda',
  alphabet: new Set(['a', 'b']),
  states: new Set(['q0', 'q1']),
  startState: 'q0',
  acceptStates: new Set(['q1']),
  stackAlphabet: new Set(['Z']),
  initialStackSymbol: 'Z',
  transitions: new Map([
    ['q0', new Map([['a,Z', { toState: 'q1', inputSymbol: 'a', stackPop: 'Z', stackPush: [] }]])],
  ]),
  messages: [],
}

const validTM = {
  name: 'test-tm',
  alphabet: new Set(['0', '1']),
  states: new Set(['q0', 'qAccept']),
  startState: 'q0',
  acceptStates: new Set(['qAccept']),
  tapeCount: 1,
  tapeAlphabet: new Set(['0', '1', '_']),
  blankSymbol: '_',
  transitions: new Map([
    ['q0', new Map([['0', { toState: 'qAccept', readSymbols: ['0'], writeSymbols: ['0'], directions: ['R'] }]])],
  ]),
  messages: [],
}

describe('validateMachine', () => {
  describe('nFA', () => {
    it('accepts a valid NFA shape', () => {
      const result = validateMachine(validNFA, 'nfa')
      expect(result.ok).toBe(true)
    })

    it('rejects payload missing required fields', () => {
      const result = validateMachine({ name: 'broken' }, 'nfa')
      expect(result.ok).toBe(false)
    })

    it('rejects null payload', () => {
      const result = validateMachine(null, 'nfa')
      expect(result.ok).toBe(false)
    })

    it('error message mentions NFA and .build()', () => {
      const result = validateMachine({}, 'nfa')
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.error.message).toMatch(/NFA/)
    })
  })

  describe('pDA', () => {
    it('accepts a valid PDA shape', () => {
      const result = validateMachine(validPDA, 'pda')
      expect(result.ok).toBe(true)
    })

    it('rejects invalid PDA payload', () => {
      const result = validateMachine({ name: 'broken' }, 'pda')
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.error.message).toMatch(/PDA/)
    })
  })

  describe('tM', () => {
    it('accepts a valid TM shape', () => {
      const result = validateMachine(validTM, 'tm')
      expect(result.ok).toBe(true)
    })

    it('rejects invalid TM payload', () => {
      const result = validateMachine({ name: 'broken' }, 'tm')
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.error.message).toMatch(/TM/)
    })
  })

  describe('cross-scope rejection', () => {
    it('rejects an NFA payload when validated as PDA', () => {
      const result = validateMachine(validNFA, 'pda')
      expect(result.ok).toBe(false)
    })

    it('rejects a TM payload when validated as NFA', () => {
      const result = validateMachine(validTM, 'nfa')
      expect(result.ok).toBe(false)
    })
  })
})
