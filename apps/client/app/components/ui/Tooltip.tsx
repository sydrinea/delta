'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type AlignPos = 'center' | 'right' | 'left'

function calculateAlignment(
  rect: DOMRect,
  tooltipWidth: number,
): { left: number, align: AlignPos } {
  const center = rect.left + rect.width / 2

  if (center + tooltipWidth / 2 > window.innerWidth - 8) {
    return { left: rect.right, align: 'right' }
  }

  if (center - tooltipWidth / 2 < 8) {
    return { left: rect.left, align: 'left' }
  }

  return { left: center, align: 'center' }
}

interface TooltipProps {
  label: string
  children: React.ReactNode
}

interface Pos {
  top: number
  left: number
  align: AlignPos
}

const STYLE_MAP = {
  center: {
    container: { transform: 'translate(-50%, -100%)' },
    arrow: { left: '50%', right: 'auto', transform: 'translateX(-50%)' },
  },
  right: {
    container: { transform: 'translate(-100%, -100%)' },
    arrow: { left: 'auto', right: '12px', transform: 'none' },
  },
  left: {
    container: { transform: 'translate(0, -100%)' },
    arrow: { left: '12px', right: 'auto', transform: 'none' },
  },
} as const

export function Tooltip({ label, children }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastTouchAtRef = useRef(0)
  const [pos, setPos] = useState<Pos | null>(null)

  const show = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore synthetic mouseenter events that can fire after touch on mobile.
    if (Date.now() - lastTouchAtRef.current < 1000)
      return

    // Tooltips should only appear on hover-capable pointing devices.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      return

    if (e.pointerType !== 'mouse')
      return

    const rect = ref.current?.getBoundingClientRect()
    if (!rect)
      return

    const tooltipWidth = label.length * 7 + 16 // rough estimate
    const { left, align } = calculateAlignment(rect, tooltipWidth)

    setPos({
      top: rect.top,
      left,
      align,
    })
  }

  return (
    <div
      ref={ref}
      className="relative"
      onPointerDownCapture={(event) => {
        if (event.pointerType !== 'mouse') {
          lastTouchAtRef.current = Date.now()
        }

        setPos(null)
      }}
      onClickCapture={() => setPos(null)}
      onPointerEnter={show}
      onPointerLeave={() => setPos(null)}
    >
      {children}
      {pos
        && createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              top: pos.top - 8,
              left: pos.left,
              ...STYLE_MAP[pos.align].container,
            }}
          >
            <div className="relative px-2 py-1 text-xs rounded bg-ctp-surface0 border-t-2 border-ctp-mauve/65 text-ctp-text whitespace-nowrap">
              {label}
              <svg
                className="absolute top-full text-ctp-surface0"
                style={STYLE_MAP[pos.align].arrow}
                width="8"
                height="4"
                viewBox="0 0 8 4"
                fill="currentColor"
              >
                <path d="M0 0L4 4L8 0" />
              </svg>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
