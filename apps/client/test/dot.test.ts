import { EPSILON } from '@delta/build'
import { describe, expect, it } from 'vitest'
import { nfaDotConfig, pdaDotConfig, tmDotConfig, toDot } from '@/lib/dot'

function makeNFA(overrides: Partial<{
  transitions: Map<string, Map<string, Set<string>>>
}> = {}) {
  return {
    name: 'test-nfa',
    alphabet: new Set(['a']),
    states: new Set(['q0', 'q1']),
    startState: 'q0',
    acceptStates: new Set(['q1']),
    transitions: overrides.transitions ?? new Map([
      ['q0', new Map([['a', new Set(['q1'])]])],
    ]),
    messages: [],
  } as any
}

function makePDA() {
  return {
    name: 'test-pda',
    alphabet: new Set(['a']),
    states: new Set(['q0', 'q1']),
    startState: 'q0',
    acceptStates: new Set(['q1']),
    stackAlphabet: new Set(['Z']),
    initialStackSymbol: 'Z',
    transitions: new Map([
      ['q0', new Map([['a,Z', { toState: 'q1', inputSymbol: 'a', stackPop: 'Z', stackPush: [] }]])],
    ]),
    messages: [],
  } as any
}

function makeTM() {
  return {
    name: 'test-tm',
    alphabet: new Set(['0']),
    states: new Set(['q0', 'qA']),
    startState: 'q0',
    acceptStates: new Set(['qA']),
    tapeCount: 1,
    tapeAlphabet: new Set(['0', '_']),
    blankSymbol: '_',
    transitions: new Map([
      ['q0', new Map([['0', { toState: 'qA', readSymbols: ['0'], writeSymbols: ['0'], directions: ['R'] }]])],
    ]),
    messages: [],
  } as any
}

describe('toDot — NFA', () => {
  it('produces a digraph string', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null)
    expect(dot).toMatch(/^digraph "test-nfa"/)
  })

  it('includes all states', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null)
    expect(dot).toContain('"q0"')
    expect(dot).toContain('"q1"')
  })

  it('marks accept state with doublecircle', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null)
    expect(dot).toMatch(/"q1" \[shape=doublecircle/)
  })

  it('marks non-accept state with circle', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null)
    expect(dot).toMatch(/"q0" \[shape=circle/)
  })

  it('includes start edge from __start__', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null)
    expect(dot).toContain('__start__ -> "q0"')
  })

  it('includes transition edge with label', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null)
    expect(dot).toContain('"q0" -> "q1"')
    expect(dot).toContain('label="a"')
  })

  it('converts EPSILON symbol to ε in edge label', () => {
    const nfa = makeNFA({
      transitions: new Map([
        ['q0', new Map([[EPSILON, new Set(['q1'])]])],
      ]),
    })
    const dot = toDot(nfa, nfaDotConfig, null)
    expect(dot).toContain('label="ε"')
  })

  it('marks active states with "active" class', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null, new Set(['q0']))
    expect(dot).toMatch(/"q0" \[shape=circle class="state active"/)
  })

  it('marks non-active states with "default" class', () => {
    const dot = toDot(makeNFA(), nfaDotConfig, null, new Set(['q0']))
    expect(dot).toMatch(/"q1" \[shape=doublecircle class="state default"/)
  })

  it('merges parallel edges into one with comma-separated labels', () => {
    const nfa = makeNFA({
      transitions: new Map([
        ['q0', new Map([
          ['a', new Set(['q1'])],
          ['b', new Set(['q1'])],
        ])],
      ]),
    })
    const dot = toDot(nfa, nfaDotConfig, null)
    expect(dot).toMatch(/"q0" -> "q1" \[label="[ab],[ab]"\]/)
  })
})

describe('toDot — PDA', () => {
  it('produces a digraph', () => {
    const dot = toDot(makePDA(), pdaDotConfig, null)
    expect(dot).toMatch(/^digraph "test-pda"/)
  })

  it('formats PDA transition label correctly', () => {
    const dot = toDot(makePDA(), pdaDotConfig, null)
    expect(dot).toContain('a, Z → ε')
  })
})

describe('toDot — TM', () => {
  it('produces a digraph', () => {
    const dot = toDot(makeTM(), tmDotConfig, null)
    expect(dot).toMatch(/^digraph "test-tm"/)
  })

  it('includes TM graph attributes', () => {
    const dot = toDot(makeTM(), tmDotConfig, null)
    expect(dot).toContain('splines=true')
  })

  it('includes edgeId attribute on TM edges', () => {
    const dot = toDot(makeTM(), tmDotConfig, null)
    expect(dot).toMatch(/id="edge_/)
  })
})
