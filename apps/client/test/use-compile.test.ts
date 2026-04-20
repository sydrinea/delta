import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCompile } from '../app/hooks/use-compile'
import { useAutomataStore } from '../app/store/automata-store'

vi.mock('../app/store/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../app/store/shared')>()
  const { createJSONStorage } = await import('zustand/middleware')
  return {
    ...actual,
    createHybridStorage: () => createJSONStorage(() => sessionStorage),
  }
})

const fixtureMachine = {
  name: 'test-nfa',
  alphabet: new Set(['a']),
  states: new Set(['q0', 'q1']),
  startState: 'q0',
  acceptStates: new Set(['q1']),
  transitions: new Map([['q0', new Map([['a', new Set(['q1'])]])]]),
  messages: [],
}

vi.mock('../app/lib/worker/compile-code', () => ({
  compileCode: vi.fn(),
}))

async function getCompileCodeMock() {
  const mod = await import('../app/lib/worker/compile-code')
  return mod.compileCode as ReturnType<typeof vi.fn>
}

beforeEach(async () => {
  useAutomataStore.setState(useAutomataStore.getInitialState())
  const mock = await getCompileCodeMock()
  mock.mockReset()
})

describe('useCompile', () => {
  it('sets machine on success and clears editorErrors', async () => {
    const mock = await getCompileCodeMock()
    mock.mockResolvedValue({ ok: true, machine: fixtureMachine })

    const { result } = renderHook(() => useCompile('nfa'))
    await act(async () => {
      await result.current('some code')
    })

    const state = useAutomataStore.getState().automata.nfa
    expect(state.machine).toEqual(fixtureMachine)
    expect(state.editorErrors).toBeNull()
  })

  it('sets editorErrors on compile failure and leaves machine unchanged', async () => {
    const mock = await getCompileCodeMock()
    const errors = [{ message: 'bad syntax', line: 1, column: 0 }]
    mock.mockResolvedValue({ ok: false, errors })

    useAutomataStore.getState().patch('nfa', { machine: fixtureMachine as any })
    const { result } = renderHook(() => useCompile('nfa'))
    await act(async () => {
      await result.current('bad code')
    })

    const state = useAutomataStore.getState().automata.nfa
    expect(state.editorErrors).toEqual(errors)
    expect(state.machine).toEqual(fixtureMachine)
  })

  it('updates store on second compile with different result', async () => {
    const mock = await getCompileCodeMock()
    const secondMachine = { ...fixtureMachine, name: 'second' }
    mock
      .mockResolvedValueOnce({ ok: true, machine: fixtureMachine })
      .mockResolvedValueOnce({ ok: true, machine: secondMachine })

    const { result } = renderHook(() => useCompile('nfa'))
    await act(async () => {
      await result.current('code v1')
    })
    await act(async () => {
      await result.current('code v2')
    })

    expect(useAutomataStore.getState().automata.nfa.machine).toEqual(secondMachine)
  })

  it('compile for nfa scope does not affect pda scope', async () => {
    const mock = await getCompileCodeMock()
    mock.mockResolvedValue({ ok: true, machine: fixtureMachine })

    const pdaMachineBefore = useAutomataStore.getState().automata.pda.machine
    const { result } = renderHook(() => useCompile('nfa'))
    await act(async () => {
      await result.current('code')
    })

    expect(useAutomataStore.getState().automata.pda.machine).toBe(pdaMachineBefore)
  })

  it('handles validation failure (invalid machine shape) by setting errors', async () => {
    const mock = await getCompileCodeMock()
    mock.mockResolvedValue({ ok: true, machine: { not: 'a valid machine' } })

    const { result } = renderHook(() => useCompile('nfa'))
    await act(async () => {
      await result.current('code')
    })

    const state = useAutomataStore.getState().automata.nfa
    expect(state.machine).toBeNull()
    expect(state.editorErrors).not.toBeNull()
    expect(state.editorErrors!.length).toBeGreaterThan(0)
  })
})
