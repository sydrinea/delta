import { EPSILON, nfa } from '@delta/build'
import { MarkerType } from 'reactflow'
import { describe, expect, it } from 'vitest'
import { nfaToFlow } from '@/lib/flow/to-flow'

describe('to flow', () => {
  it('converts an NFA to a reactflow layout', () => {
    const machine = nfa('test')
      .alphabet('a', 'b')
      .states('q0', 'q1')
      .start('q0')
      .accept('q1')
      .transition('q0', 'a', 'q1')
      .transition('q0', 'b', 'q0')
      .build()

    const { nodes, edges } = nfaToFlow(machine)

    expect(nodes).toHaveLength(2)
    // Verify nodes map correctly
    const q0Node = nodes.find(n => n.id === 'q0')
    expect(q0Node).toBeDefined()
    expect(q0Node?.data.isStart).toBe(true)
    expect(q0Node?.data.isAccept).toBe(false)

    const q1Node = nodes.find(n => n.id === 'q1')
    expect(q1Node).toBeDefined()
    expect(q1Node?.data.isStart).toBe(false)
    expect(q1Node?.data.isAccept).toBe(true)

    // Verify edges map correctly
    expect(edges).toHaveLength(2)
    const edgeA = edges.find(
      e => e.source === 'q0' && e.target === 'q1' && e.data.label === 'a',
    )
    expect(edgeA).toBeDefined()
    expect(edgeA?.markerEnd).toEqual({
      type: MarkerType.ArrowClosed,
      color: '#4c4f69',
    })

    const edgeB = edges.find(
      e => e.source === 'q0' && e.target === 'q0' && e.data.label === 'b',
    )
    expect(edgeB).toBeDefined()
  })

  it('handles epsilon transitions properly', () => {
    const machine = nfa('eps')
      .states('q0', 'q1')
      .start('q0')
      .transition('q0', EPSILON, 'q1') // EPSILON
      .build()

    const { edges } = nfaToFlow(machine)
    expect(edges[0]?.data.label).toBe('ε')
  })
})
