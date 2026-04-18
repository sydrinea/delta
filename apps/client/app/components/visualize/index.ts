export { ConfigurationTable } from './ConfigurationTable'
export { GraphvizViewer } from './GraphvizViewer'
export { useScrollableTable } from './hooks/useScrollableTable'
export { PDABottomPanel } from './PDABottomPanel'
export { StackVisualizer } from './StackVisualizer'
export { Trace } from './Trace'
export type { PDAConfiguration, TraceBottomPanelContext, TraceInputArgs, TraceStep } from './TraceContext'
export {
  TraceProvider,
  useTraceInputContext,
  useTraceInteractionContext,
  useTraceSimulationContext,
} from './TraceContext'
export { TransitionTable } from './TransitionTable'
export type { TMTransitionRow } from '@/lib/tm-metadata'
