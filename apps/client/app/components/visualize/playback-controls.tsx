'use client'

import { ArrowLeft, ArrowRight, FastForward, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { useSimulatorStore } from '@/store/simulator-store'
import { Button } from '../ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '../ui/button-group'
import { WithTooltip } from '../ui/tooltip'

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

  const maxStep = Math.max(0, trace.length - 1)
  const isLast = trace.length > 0 && step === maxStep

  const stepBack = () => setStep(s => Math.max(0, s - 1))
  const stepForward = () => setStep(s => Math.min(maxStep, s + 1))
  const reset = () => {
    setIsPlaying(false)
    setStep(0)
  }
  const togglePlay = () => {
    if (isLast && !isPlaying) {
      setStep(0)
    }
    setIsPlaying(!isPlaying)
  }
  const toggleSpeed = () => setSpeed(speed === 500 ? 200 : speed === 200 ? 50 : 500)

  useEffect(() => {
    if (!isPlaying)
      return
    if (isLast) {
      setIsPlaying(false)
      return
    }

    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) {
          setIsPlaying(false)
          return s
        }
        return s + 1
      })
    }, speed)

    return () => clearInterval(timer)
  }, [isPlaying, isLast, speed, maxStep, setStep, setIsPlaying])

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
