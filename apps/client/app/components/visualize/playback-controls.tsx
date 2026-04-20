'use client'

import { ArrowLeft, ArrowRight, FastForward, Pause, Play, RotateCcw } from 'lucide-react'
import { useRef } from 'react'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { useSimulatorStore } from '@/store/simulator-store'
import { WithTooltip } from '../ui/overlays/tooltip'
import { Button } from '../ui/primitives/button'
import { ButtonGroup, ButtonGroupSeparator } from '../ui/primitives/button-group'

interface PlaybackControlsProps {
  focused?: boolean
}

export function PlaybackControls({ focused = true }: PlaybackControlsProps) {
  const step = useSimulatorStore(s => s.step)
  const trace = useSimulatorStore(s => s.trace)
  const setStep = useSimulatorStore(s => s.setStep)
  const isPlaying = useSimulatorStore(s => s.isPlaying)
  const setIsPlaying = useSimulatorStore(s => s.setIsPlaying)
  const speed = useSimulatorStore(s => s.speed)
  const setSpeed = useSimulatorStore(s => s.setSpeed)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxStepRef = useRef(0)
  maxStepRef.current = Math.max(0, trace.length - 1)

  const maxStep = maxStepRef.current
  const isLast = trace.length > 0 && step === maxStep

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = (intervalMs: number) => {
    clearTimer()
    timerRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= maxStepRef.current) {
          clearTimer()
          setIsPlaying(false)
          return s
        }
        return s + 1
      })
    }, intervalMs)
  }

  const stepBack = () => setStep(s => Math.max(0, s - 1))
  const stepForward = () => setStep(s => Math.min(maxStep, s + 1))

  const reset = () => {
    clearTimer()
    setIsPlaying(false)
    setStep(0)
  }

  const togglePlay = () => {
    if (isPlaying) {
      clearTimer()
      setIsPlaying(false)
    }
    else {
      if (isLast)
        setStep(0)
      setIsPlaying(true)
      startTimer(speed)
    }
  }

  const toggleSpeed = () => {
    const next = speed === 500 ? 200 : speed === 200 ? 50 : 500
    setSpeed(next)
    if (isPlaying)
      startTimer(next)
  }

  useKeyboardShortcut([
    { key: 'ArrowRight', handler: () => {
      if (focused)
        stepForward()
    } },
    { key: 'ArrowLeft', handler: () => {
      if (focused)
        stepBack()
    } },
    { key: ' ', handler: () => {
      if (focused)
        togglePlay()
    }, preventDefault: true },
    { key: 'r', handler: () => {
      if (focused)
        reset()
    } },
    { key: 's', handler: () => {
      if (focused)
        toggleSpeed()
    } },
  ])

  return (
    <div className="sticky bottom-6 mt-auto flex flex-col items-center gap-3 z-50">
      <div className="pointer-events-auto drop-shadow-xl hover:drop-shadow-2xl transition-all">
        <ButtonGroup>
          <WithTooltip shortcut={['R']}>
            <Button variant="ghost" size="icon-sm" onClick={reset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </WithTooltip>
          <ButtonGroupSeparator />
          <WithTooltip shortcut={['arrowleft']}>
            <Button variant="ghost" size="icon-sm" onClick={stepBack} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </WithTooltip>
          <ButtonGroupSeparator />
          <WithTooltip shortcut={['space']}>
            <Button variant="ghost" size="icon-sm" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </WithTooltip>
          <ButtonGroupSeparator />
          <WithTooltip shortcut={['arrowright']}>
            <Button variant="ghost" size="icon-sm" onClick={stepForward} disabled={isLast}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </WithTooltip>
          <ButtonGroupSeparator />
          <WithTooltip shortcut={['S']}>
            <Button variant="ghost" size="icon-sm" onClick={toggleSpeed}>
              <FastForward className={`w-4 h-4 ${speed === 50 ? 'text-destructive' : speed === 200 ? 'text-warning' : ''}`} />
            </Button>
          </WithTooltip>
        </ButtonGroup>
      </div>
    </div>
  )
}
