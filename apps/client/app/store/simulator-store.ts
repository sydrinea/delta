import { create } from 'zustand'

export interface PDAConfiguration {
  state: string
  stack: string[]
}

export interface TraceStep {
  states: Set<string>
  tapes?: string[][]
  configurations?: PDAConfiguration[]
}

export interface TraceSimulationResult {
  accepted: boolean
  trace: TraceStep[]
  halted?: boolean
  exceededStepLimit?: boolean
}

interface SimulatorState {
  input: string
  trace: TraceStep[]
  step: number
  isPlaying: boolean
  speed: number
  hoveredEdgeId: string | null
  accepted: boolean

  setInput: (input: string) => void
  setTrace: (trace: TraceStep[]) => void
  setStep: (step: number | ((prev: number) => number)) => void
  setIsPlaying: (isPlaying: boolean) => void
  setSpeed: (speed: number) => void
  setHoveredEdgeId: (id: string | null) => void
  setAccepted: (accepted: boolean) => void
  reset: () => void
}

export const useSimulatorStore = create<SimulatorState>(set => ({
  input: '',
  trace: [],
  step: 0,
  isPlaying: false,
  speed: 500,
  hoveredEdgeId: null,
  accepted: false,

  setInput: input => set({ input }),
  setTrace: trace => set({ trace }),
  setStep: step => set(state => ({
    step: typeof step === 'function' ? step(state.step) : step,
  })),
  setIsPlaying: isPlaying => set({ isPlaying }),
  setSpeed: speed => set({ speed }),
  setHoveredEdgeId: id => set({ hoveredEdgeId: id }),
  setAccepted: accepted => set({ accepted }),
  reset: () => set({ input: '', trace: [], step: 0, isPlaying: false, hoveredEdgeId: null, accepted: false }),
}))
