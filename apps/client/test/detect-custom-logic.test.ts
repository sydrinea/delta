import { describe, expect, it } from 'vitest'
import { containsCustomLogicOrComments } from '@/lib/detect-custom-logic'

describe('containsCustomLogicOrComments', () => {
  describe('empty / blank input', () => {
    it('returns false for empty string', () => {
      expect(containsCustomLogicOrComments('')).toBe(false)
    })

    it('returns false for whitespace-only string', () => {
      expect(containsCustomLogicOrComments('   \n  ')).toBe(false)
    })
  })

  describe('target method calls', () => {
    it('detects top-level function call (e.g. nfa())', () => {
      expect(containsCustomLogicOrComments(`import nfa from '@delta/build'\nconst m = nfa('x').build()`)).toBe(false)
    })

    it('detects target method on chain (.loop)', () => {
      expect(containsCustomLogicOrComments(`m.loop('q0')`)).toBe(true)
    })

    it('detects .to method', () => {
      expect(containsCustomLogicOrComments(`builder.to('q1')`)).toBe(true)
    })

    it('detects .done method', () => {
      expect(containsCustomLogicOrComments(`builder.done()`)).toBe(true)
    })

    it('detects .star method', () => {
      expect(containsCustomLogicOrComments(`n.star()`)).toBe(true)
    })

    it('detects top-level thompson call', () => {
      expect(containsCustomLogicOrComments(`thompson('a')`)).toBe(true)
    })

    it('detects top-level union call', () => {
      expect(containsCustomLogicOrComments(`union(a, b)`)).toBe(true)
    })

    it('detects top-level concat call', () => {
      expect(containsCustomLogicOrComments(`concat(a, b)`)).toBe(true)
    })

    it('detects top-level eps call', () => {
      expect(containsCustomLogicOrComments(`eps()`)).toBe(true)
    })
  })

  describe('comments', () => {
    it('detects line comments', () => {
      expect(containsCustomLogicOrComments(`const x = 1 // my comment`)).toBe(true)
    })

    it('detects block comments', () => {
      expect(containsCustomLogicOrComments(`/* block */ const x = 1`)).toBe(true)
    })
  })

  describe('library-only code (no custom logic)', () => {
    it('returns false for code with only .build()', () => {
      expect(containsCustomLogicOrComments(`nfa('x').state('q0').build()`)).toBe(true)
    })

    it('returns false for plain variable assignments', () => {
      expect(containsCustomLogicOrComments(`const x = 1\nconst y = 2`)).toBe(false)
    })
  })

  describe('parse failures', () => {
    it('returns false for completely invalid syntax', () => {
      expect(containsCustomLogicOrComments('<<< not valid js >>>')).toBe(false)
    })
  })
})
