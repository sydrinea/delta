import { recipes } from '@delta/examples/recipes'
import { describe, expect, it } from 'vitest'
import { recipeKeyToSlug, slugToRecipeKey } from '@/lib/recipe-slug'

const nfaKeys = Object.keys(recipes.nfa)
const pdaKeys = Object.keys(recipes.pda)
const tmKeys = Object.keys(recipes.tm)

describe('recipeKeyToSlug', () => {
  it('returns a non-empty slug for a known NFA key', () => {
    const key = nfaKeys[0]
    const slug = recipeKeyToSlug('nfa', key)
    expect(typeof slug).toBe('string')
    expect(slug!.length).toBeGreaterThan(0)
  })

  it('returns a non-empty slug for a known PDA key', () => {
    const key = pdaKeys[0]
    const slug = recipeKeyToSlug('pda', key)
    expect(typeof slug).toBe('string')
    expect(slug!.length).toBeGreaterThan(0)
  })

  it('returns a non-empty slug for a known TM key', () => {
    const key = tmKeys[0]
    const slug = recipeKeyToSlug('tm', key)
    expect(typeof slug).toBe('string')
    expect(slug!.length).toBeGreaterThan(0)
  })

  it('returns null for an unknown key', () => {
    expect(recipeKeyToSlug('nfa', '__nonexistent__')).toBeNull()
  })
})

describe('slugToRecipeKey', () => {
  it('round-trips: key → slug → key for all NFA recipes', () => {
    for (const key of nfaKeys) {
      const slug = recipeKeyToSlug('nfa', key)!
      expect(slugToRecipeKey('nfa', slug)).toBe(key)
    }
  })

  it('round-trips: key → slug → key for all PDA recipes', () => {
    for (const key of pdaKeys) {
      const slug = recipeKeyToSlug('pda', key)!
      expect(slugToRecipeKey('pda', slug)).toBe(key)
    }
  })

  it('round-trips: key → slug → key for all TM recipes', () => {
    for (const key of tmKeys) {
      const slug = recipeKeyToSlug('tm', key)!
      expect(slugToRecipeKey('tm', slug)).toBe(key)
    }
  })

  it('returns null for an unknown slug', () => {
    expect(slugToRecipeKey('nfa', '__no-such-slug__')).toBeNull()
  })
})
