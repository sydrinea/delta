import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulatorStore } from '../app/store/simulator-store'

beforeEach(() => {
  useSimulatorStore.getState().reset()
})

describe('useSimulatorStore', () => {
  describe('initial state', () => {
    it('starts with empty input and trace', () => {
      const s = useSimulatorStore.getState()
      expect(s.input).toBe('')
      expect(s.trace).toEqual([])
    })

    it('starts at step 0, not playing, speed 500', () => {
      const s = useSimulatorStore.getState()
      expect(s.step).toBe(0)
      expect(s.isPlaying).toBe(false)
      expect(s.speed).toBe(500)
    })

    it('starts with no hoveredEdgeId and accepted false', () => {
      const s = useSimulatorStore.getState()
      expect(s.hoveredEdgeId).toBeNull()
      expect(s.accepted).toBe(false)
    })
  })

  describe('setters', () => {
    it('setInput updates input', () => {
      useSimulatorStore.getState().setInput('abc')
      expect(useSimulatorStore.getState().input).toBe('abc')
    })

    it('setTrace updates trace', () => {
      const trace = [{ states: new Set(['q0']) }, { states: new Set(['q1']) }]
      useSimulatorStore.getState().setTrace(trace)
      expect(useSimulatorStore.getState().trace).toEqual(trace)
    })

    it('setStep with number value updates step', () => {
      useSimulatorStore.getState().setStep(3)
      expect(useSimulatorStore.getState().step).toBe(3)
    })

    it('setStep with function updater increments correctly', () => {
      useSimulatorStore.getState().setStep(2)
      useSimulatorStore.getState().setStep(prev => prev + 1)
      expect(useSimulatorStore.getState().step).toBe(3)
    })

    it('setIsPlaying toggles playback', () => {
      useSimulatorStore.getState().setIsPlaying(true)
      expect(useSimulatorStore.getState().isPlaying).toBe(true)
      useSimulatorStore.getState().setIsPlaying(false)
      expect(useSimulatorStore.getState().isPlaying).toBe(false)
    })

    it('setSpeed updates speed', () => {
      useSimulatorStore.getState().setSpeed(250)
      expect(useSimulatorStore.getState().speed).toBe(250)
    })

    it('setHoveredEdgeId updates and clears', () => {
      useSimulatorStore.getState().setHoveredEdgeId('edge-1')
      expect(useSimulatorStore.getState().hoveredEdgeId).toBe('edge-1')
      useSimulatorStore.getState().setHoveredEdgeId(null)
      expect(useSimulatorStore.getState().hoveredEdgeId).toBeNull()
    })

    it('setAccepted updates acceptance', () => {
      useSimulatorStore.getState().setAccepted(true)
      expect(useSimulatorStore.getState().accepted).toBe(true)
    })
  })

  describe('reset', () => {
    it('clears all state back to defaults', () => {
      const s = useSimulatorStore.getState()
      s.setInput('hello')
      s.setTrace([{ states: new Set(['q0']) }])
      s.setStep(5)
      s.setIsPlaying(true)
      s.setHoveredEdgeId('e1')
      s.setAccepted(true)
      s.reset()
      const after = useSimulatorStore.getState()
      expect(after.input).toBe('')
      expect(after.trace).toEqual([])
      expect(after.step).toBe(0)
      expect(after.isPlaying).toBe(false)
      expect(after.hoveredEdgeId).toBeNull()
      expect(after.accepted).toBe(false)
    })

    it('does not reset speed', () => {
      useSimulatorStore.getState().setSpeed(100)
      useSimulatorStore.getState().reset()
      expect(useSimulatorStore.getState().speed).toBe(100)
    })
  })
})
