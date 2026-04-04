'use client'

import type { TestCase } from '@delta/examples'
import type { ReactNode } from 'react'
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useStepNavigation } from '@/hooks/useStepNavigation'

export interface TraceStep {
  states: Set<string>
  tapes?: string[][]
}

export interface TraceSimulationResult {
  accepted: boolean
  trace: TraceStep[]
}

export interface VisualMachine {
  name: string
}

export interface TraceInputArgs {
  input: string
  current: TraceStep
  step: number
  maxStep: number
  isLast: boolean
  windowSize?: number
}

export interface TraceInputToken {
  key: string
  text: string
  className: string
  row?: number
  isActive?: boolean
}

export interface TraceBottomPanelContext<M extends VisualMachine> {
  machine: M
  current: TraceStep
  trace: TraceStep[]
  step: number
  maxStep: number
  isLast: boolean
  input: string
  accepted: boolean
  dot: string
  hoveredEdgeId: string | null
  setHoveredEdgeId: (edgeId: string | null) => void
}

interface TraceInputContextValue {
  tests: TestCase[]
  input: string
  setInput: (value: string) => void
  selectedTest: string
  setSelectedTest: (value: string) => void
}

interface TraceSimulationContextValue<M extends VisualMachine> {
  machine: M | null
  simulation: TraceSimulationResult | null
  trace: TraceStep[]
  step: number
  maxStep: number
  safeStep: number
  current: TraceStep | null
  dot: string | null
  isEmpty: boolean
  isLast: boolean
  accepted: boolean
  getInputTokens: (args: TraceInputArgs) => TraceInputToken[]
  bottomPanel?: (context: TraceBottomPanelContext<M>) => ReactNode
}

interface TraceInteractionContextValue {
  hoveredEdgeId: string | null
  setHoveredEdgeId: (id: string | null) => void
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  // Step navigation — exposed so mobile UI can provide explicit buttons
  stepBack: () => void
  stepForward: () => void
}

type TraceContextValue<M extends VisualMachine> = TraceInputContextValue
  & TraceSimulationContextValue<M>
  & TraceInteractionContextValue

const TraceInputContext = createContext<TraceInputContextValue | null>(null)
const TraceSimulationContext
  = createContext<TraceSimulationContextValue<VisualMachine> | null>(null)
const TraceInteractionContext
  = createContext<TraceInteractionContextValue | null>(null)

interface TraceProviderProps<M extends VisualMachine> {
  children: ReactNode
  machine: M | null
  tests: TestCase[]
  simulate: (machine: M, input: string) => TraceSimulationResult
  getDot: (machine: M, states: Set<string>) => string
  getInputTokens: (args: TraceInputArgs) => TraceInputToken[]
  bottomPanel?: (context: TraceBottomPanelContext<M>) => ReactNode
}

export function TraceProvider<M extends VisualMachine>({
  children,
  machine,
  tests,
  simulate,
  getDot,
  getInputTokens,
  bottomPanel,
}: TraceProviderProps<M>) {
  const [input, setInput] = useState('')
  const [selectedTest, setSelectedTest] = useState('')
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

  // If a recipe/test set change removes the selected test, reset to placeholder.
  useEffect(() => {
    if (!selectedTest)
      return

    const stillExists = tests.some(test => test.id === selectedTest)
    if (!stillExists)
      // eslint-disable-next-line react/set-state-in-effect
      setSelectedTest('')
  }, [tests, selectedTest])

  const simulation = useMemo(() => {
    if (!machine)
      return null
    return simulate(machine, input)
  }, [input, machine, simulate])

  const trace = useMemo(() => simulation?.trace ?? [], [simulation])
  const maxStep = Math.max(0, trace.length - 1)

  const {
    step,
    focused,
    onFocus,
    onBlur,
    onTouchStart,
    onTouchEnd,
    // These are the new additions you need to expose from useStepNavigation:
    stepBack,
    stepForward,
  } = useStepNavigation({
    maxStep,
    resetDeps: [input, machine],
    focusRequiredForKeys: true,
    enableSwipe: true,
  })

  const safeStep = Math.min(step, maxStep)
  const current = trace[safeStep] ?? null
  const dot = useMemo(() => {
    if (!machine || !current)
      return null
    return getDot(machine, current.states)
  }, [machine, current, getDot])

  const isEmpty = input === ''
  const isLast = safeStep === maxStep
  const accepted = simulation?.accepted ?? false

  const inputValue = useMemo<TraceInputContextValue>(
    () => ({
      tests,
      input,
      setInput,
      selectedTest,
      setSelectedTest,
    }),
    [tests, input, selectedTest],
  )

  const simulationValue = useMemo<TraceSimulationContextValue<M>>(
    () => ({
      machine,
      simulation,
      trace,
      step,
      maxStep,
      safeStep,
      current,
      dot,
      isEmpty,
      isLast,
      accepted,
      getInputTokens,
      bottomPanel,
    }),
    [
      machine,
      simulation,
      trace,
      step,
      maxStep,
      safeStep,
      current,
      dot,
      isEmpty,
      isLast,
      accepted,
      getInputTokens,
      bottomPanel,
    ],
  )

  const interactionValue = useMemo<TraceInteractionContextValue>(
    () => ({
      hoveredEdgeId,
      setHoveredEdgeId,
      focused,
      onFocus,
      onBlur,
      onTouchStart,
      onTouchEnd,
      stepBack,
      stepForward,
    }),
    [hoveredEdgeId, focused, onFocus, onBlur, onTouchStart, onTouchEnd, stepBack, stepForward],
  )

  return (
    <TraceInputContext value={inputValue}>
      <TraceSimulationContext
        value={
          simulationValue as unknown as TraceSimulationContextValue<VisualMachine>
        }
      >
        <TraceInteractionContext value={interactionValue}>
          {children}
        </TraceInteractionContext>
      </TraceSimulationContext>
    </TraceInputContext>
  )
}

export function useTraceInputContext() {
  const context = use(TraceInputContext)
  if (!context) {
    throw new Error('useTraceInputContext must be used within a TraceProvider')
  }
  return context
}

export function useTraceSimulationContext<M extends VisualMachine>() {
  const context = use(TraceSimulationContext)
  if (!context) {
    throw new Error(
      'useTraceSimulationContext must be used within a TraceProvider',
    )
  }
  return context as unknown as TraceSimulationContextValue<M>
}

export function useTraceInteractionContext() {
  const context = use(TraceInteractionContext)
  if (!context) {
    throw new Error(
      'useTraceInteractionContext must be used within a TraceProvider',
    )
  }
  return context
}

export function useTraceContext<M extends VisualMachine>() {
  const inputContext = useTraceInputContext()
  const simulationContext = useTraceSimulationContext<M>()
  const interactionContext = useTraceInteractionContext()

  return {
    ...inputContext,
    ...simulationContext,
    ...interactionContext,
  } as TraceContextValue<M>
}
