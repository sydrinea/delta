import type {
  TMTransitionRow,
} from '@/lib/tm-metadata'
import { describe, expect, it } from 'vitest'
import {
  activeTupleFromTapes,
  buildTMTransitionRows,
  edgeIdForStates,
  edgeKeyForStates,
  filterStepRelevantTMTransitions,
  formatReadTuple,
} from '@/lib/tm-metadata'

function makeTM(transitions: [string, string, string[], string[], string[]][]) {
  const map = new Map<string, Map<string, { toState: string, readSymbols: string[], writeSymbols: string[], directions: string[] }>>()
  for (const [from, to, read, write, dirs] of transitions) {
    if (!map.has(from))
      map.set(from, new Map())
    const key = read.join(',')
    map.get(from)!.set(key, { toState: to, readSymbols: read, writeSymbols: write, directions: dirs })
  }
  return { transitions: map } as any
}

describe('edgeKeyForStates', () => {
  it('produces stable key', () => {
    expect(edgeKeyForStates('q0', 'q1')).toBe('q0→q1')
  })
})

describe('edgeIdForStates', () => {
  it('produces stable id for same inputs', () => {
    expect(edgeIdForStates('q0', 'q1')).toBe(edgeIdForStates('q0', 'q1'))
  })

  it('produces different ids for different state pairs', () => {
    expect(edgeIdForStates('q0', 'q1')).not.toBe(edgeIdForStates('q1', 'q0'))
  })

  it('id starts with "edge_"', () => {
    expect(edgeIdForStates('a', 'b')).toMatch(/^edge_/)
  })
})

describe('formatReadTuple', () => {
  it('formats single symbol', () => {
    expect(formatReadTuple(['0'])).toBe('[0]')
  })

  it('formats multiple symbols', () => {
    expect(formatReadTuple(['0', '1'])).toBe('[0, 1]')
  })
})

describe('buildTMTransitionRows', () => {
  it('returns empty array for machine with no transitions', () => {
    const tm = { transitions: new Map() } as any
    expect(buildTMTransitionRows(tm)).toEqual([])
  })

  it('assigns sequential ids starting from t1', () => {
    const tm = makeTM([
      ['q0', 'q1', ['0'], ['0'], ['R']],
      ['q0', 'q1', ['1'], ['1'], ['R']],
    ])
    const rows = buildTMTransitionRows(tm)
    expect(rows[0].id).toBe('t1')
    expect(rows[1].id).toBe('t2')
  })

  it('sorts rows by fromState then toState', () => {
    const tm = makeTM([
      ['q1', 'qAccept', ['0'], ['0'], ['R']],
      ['q0', 'q1', ['0'], ['0'], ['R']],
    ])
    const rows = buildTMTransitionRows(tm)
    expect(rows[0].fromState).toBe('q0')
    expect(rows[1].fromState).toBe('q1')
  })

  it('attaches edgeKey and edgeId to each row', () => {
    const tm = makeTM([['q0', 'q1', ['0'], ['0'], ['R']]])
    const rows = buildTMTransitionRows(tm)
    expect(rows[0].edgeKey).toBe('q0→q1')
    expect(rows[0].edgeId).toBe(edgeIdForStates('q0', 'q1'))
  })
})

describe('activeTupleFromTapes', () => {
  it('returns null for undefined', () => {
    expect(activeTupleFromTapes(undefined)).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(activeTupleFromTapes([])).toBeNull()
  })

  it('extracts active cell from bracketed notation', () => {
    expect(activeTupleFromTapes([['a', '[b]', 'c']])).toEqual(['b'])
  })

  it('returns blank symbol when no active cell found', () => {
    expect(activeTupleFromTapes([['a', 'b', 'c']])).toEqual(['_'])
  })

  it('handles multi-tape', () => {
    expect(activeTupleFromTapes([['[0]', '1'], ['a', '[b]']])).toEqual(['0', 'b'])
  })
})

describe('filterStepRelevantTMTransitions', () => {
  const rows: TMTransitionRow[] = [
    { fromState: 'q0', toState: 'q1', readSymbols: ['0'], writeSymbols: ['0'], directions: ['R'], id: 't1', edgeKey: 'q0→q1', edgeId: 'e1' },
    { fromState: 'q0', toState: 'q1', readSymbols: ['1'], writeSymbols: ['1'], directions: ['L'], id: 't2', edgeKey: 'q0→q1', edgeId: 'e1' },
    { fromState: 'q1', toState: 'qA', readSymbols: ['0'], writeSymbols: ['0'], directions: ['R'], id: 't3', edgeKey: 'q1→qA', edgeId: 'e2' },
  ]

  it('returns empty array if state is null', () => {
    expect(filterStepRelevantTMTransitions(rows, null, ['0'])).toEqual([])
  })

  it('returns empty array if readTuple is null', () => {
    expect(filterStepRelevantTMTransitions(rows, 'q0', null)).toEqual([])
  })

  it('filters by matching state and readSymbols', () => {
    const result = filterStepRelevantTMTransitions(rows, 'q0', ['0'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t1')
  })

  it('excludes rows where readSymbols length differs', () => {
    const result = filterStepRelevantTMTransitions(rows, 'q0', ['0', '1'])
    expect(result).toHaveLength(0)
  })

  it('returns all matching rows for a state', () => {
    const result = filterStepRelevantTMTransitions(rows, 'q0', ['0'])
    expect(result.every(r => r.fromState === 'q0')).toBe(true)
  })
})
