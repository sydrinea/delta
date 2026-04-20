'use client'

import { flavors } from '@catppuccin/palette'
import { Transition, TransitionChild } from '@headlessui/react'
import { instance } from '@viz-js/viz'
import {
  Check,
  Code,
  Copy,
  Download,
  Maximize,
  Minimize2,
  Network,
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Surface } from '../ui'
import { WithTooltip } from '../ui/overlays/tooltip'
import { Button } from '../ui/primitives/button'
import { ButtonGroup } from '../ui/primitives/button-group'

export function toSvg(svg: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(svg)
}

export function toPng(svg: SVGSVGElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const bbox = svg.getBBox()
    const width = svg.width.baseVal.value || bbox.width
    const height = svg.height.baseVal.value || bbox.height
    const scale = 2

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return reject(new Error('No canvas context'))

    const xml = toSvg(svg)
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = flavors.mocha.colors.base.hex
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, width * scale, height * scale)

      canvas.toBlob((blob) => {
        if (blob)
          resolve(blob)
        else reject(new Error('Canvas to Blob failed'))
      }, 'image/png')

      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}
interface GraphvizViewerProps {
  dot: string
  machineName: string
  showExportActions?: boolean
  onEdgeHover?: (transitionId: string | null) => void
  fullscreenNodesep?: number
  fullscreenRanksep?: number
}

type ActionType = 'png' | 'svg' | 'dot' | 'download' | null

function withFullscreenLayout(
  dot: string,
  nodesep: number,
  ranksep: number,
): string {
  const lines = dot.split('\n')
  const rankdirIndex = lines.findIndex(line =>
    line.trim().startsWith('rankdir='),
  )

  const upsertGraphAttribute = (key: string, value: string) => {
    const index = lines.findIndex(line => line.trim().startsWith(`${key}=`))
    const nextLine = `  ${key}=${value}`

    if (index >= 0) {
      lines[index] = nextLine
      return
    }

    if (rankdirIndex >= 0) {
      lines.splice(rankdirIndex + 1, 0, nextLine)
    }
  }

  upsertGraphAttribute('nodesep', nodesep.toString())
  upsertGraphAttribute('ranksep', ranksep.toString())

  return lines.join('\n')
}

export function GraphvizViewer({
  dot,
  machineName,
  showExportActions = false,
  onEdgeHover,
  fullscreenNodesep = 1.25,
  fullscreenRanksep = 1.4,
}: GraphvizViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionState, setActionState] = useState<ActionType>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenDot = useMemo(
    () => withFullscreenLayout(dot, fullscreenNodesep, fullscreenRanksep),
    [dot, fullscreenNodesep, fullscreenRanksep],
  )

  const isMounted = typeof document !== 'undefined'

  const updateHoveredEdge = useCallback((target: EventTarget | null) => {
    if (!onEdgeHover)
      return

    if (!(target instanceof Element)) {
      onEdgeHover(null)
      return
    }

    const hoveredEdge = target.closest<SVGGElement>('g.edge')
    onEdgeHover(hoveredEdge?.getAttribute('id') ?? null)
  }, [onEdgeHover])

  const clearHoveredEdge = useCallback(() => {
    onEdgeHover?.(null)
  }, [onEdgeHover])

  useEffect(() => {
    let cancelled = false

    instance().then((viz) => {
      try {
        if (cancelled)
          return

        const standardSvg = viz.renderSVGElement(dot)
        standardSvg.style.maxWidth = '100%'
        standardSvg.style.maxHeight = '60vh'

        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(standardSvg)
        }

        if (fullscreenContainerRef.current) {
          const fullscreenSvg = viz.renderSVGElement(fullscreenDot)
          fullscreenSvg.style.maxWidth = '100%'
          fullscreenSvg.style.maxHeight = '100%'
          fullscreenContainerRef.current.innerHTML = ''
          fullscreenContainerRef.current.appendChild(fullscreenSvg)
        }

        setError(null)
      }
      catch (e) {
        setError(String(e))
      }
    })

    return () => {
      cancelled = true
      clearHoveredEdge()
    }
  }, [clearHoveredEdge, dot, fullscreenDot, isFullscreen])

  useEffect(() => {
    if (!isFullscreen)
      return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isFullscreen])

  const triggerActionFeedback = (type: ActionType) => {
    setActionState(type)
    setTimeout(setActionState, 2000, null)
  }

  const getSvg = () => containerRef.current?.querySelector('svg') ?? null

  const handleCopyDot = () => {
    navigator.clipboard.writeText(dot)
    triggerActionFeedback('dot')
  }

  const handleCopySvg = () => {
    const svg = getSvg()
    if (!svg)
      return

    navigator.clipboard.writeText(toSvg(svg))
    triggerActionFeedback('svg')
  }

  const handleDownloadPng = async () => {
    const svg = getSvg()
    if (!svg)
      return

    try {
      const blob = await toPng(svg)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${machineName || 'automata'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      triggerActionFeedback('download')
    }
    catch (err) {
      console.error('Failed to download image:', err)
    }
  }

  const handleCopyPng = async () => {
    const svg = getSvg()
    if (!svg)
      return

    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({ 'image/png': toPng(svg) }),
      ])
      triggerActionFeedback('png')
    }
    catch (err) {
      console.error('Failed to copy image to clipboard:', err)
    }
  }

  const exportActions = [
    {
      id: 'download',
      label: 'Download PNG',
      icon: Download,
      handler: handleDownloadPng,
    },
    {
      id: 'png',
      label: 'Copy Image',
      icon: Copy,
      handler: handleCopyPng,
    },
    {
      id: 'svg',
      label: 'Copy SVG',
      icon: Code,
      handler: handleCopySvg,
    },
    {
      id: 'dot',
      label: 'Copy DOT',
      icon: Network,
      handler: handleCopyDot,
    },
  ] as const

  if (error) {
    return <div className="text-destructive text-sm p-4">{error}</div>
  }

  const renderViewerContent = (fullscreenMode: boolean) => (
    <>
      <Surface
        ref={fullscreenMode ? fullscreenContainerRef : containerRef}
        className="rounded-2xl p-6 flex items-center justify-center min-h-48 overflow-hidden h-full"
        onMouseMove={event => updateHoveredEdge(event.target)}
        onMouseLeave={clearHoveredEdge}
      />

      {showExportActions && (
        <ButtonGroup className="absolute bottom-3 left-3">
          {exportActions.map(
            ({ id, label, icon: Icon, handler }) => (
              <WithTooltip label={label} key={id}>
                <Button
                  onClick={handler}
                  size="icon"
                >
                  {actionState === id
                    ? <Check className="w-4 h-4" />
                    : <Icon className="w-4 h-4" />}
                </Button>
              </WithTooltip>
            ),
          )}
        </ButtonGroup>
      )}

      <ButtonGroup className="absolute bottom-3 right-3">
        <WithTooltip label={fullscreenMode ? 'Exit Fullscreen' : 'Fullscreen'}>
          <Button
            onClick={() => setIsFullscreen(value => !value)}
            size="icon"
          >
            {isFullscreen
              ? <Minimize2 className="w-4 h-4" />
              : <Maximize className="w-4 h-4" />}
          </Button>
        </WithTooltip>
      </ButtonGroup>
    </>
  )

  return (
    <>
      <div className="relative group">{renderViewerContent(false)}</div>

      {isMounted
        && createPortal(
          <Transition as={Fragment} show={isFullscreen}>
            <div
              className="fixed inset-0 z-modal p-3 sm:p-4 md:p-6"
              onClick={() => setIsFullscreen(false)}
            >
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute inset-0 bg-background/35 backdrop-blur-sm" />
              </TransitionChild>

              <TransitionChild
                as={Fragment}
                enter="ease-out duration-250"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-180"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div
                  className="relative h-full w-full rounded-2xl border border-muted bg-background/95 shadow-2xl overflow-hidden"
                  onClick={event => event.stopPropagation()}
                >
                  {renderViewerContent(true)}
                </div>
              </TransitionChild>
            </div>
          </Transition>,
          document.body,
        )}
    </>
  )
}
