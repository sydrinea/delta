'use client'

import { Check, Copy } from 'lucide-react'
import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { ButtonGroup } from './button-group'

type CodeProps = React.ComponentPropsWithoutRef<'pre'>
const TRAILING_NEWLINES_RE = /\n+$/

function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('')
  }

  if (isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }

  return ''
}

export function Code({ children, className, ...props }: CodeProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const preRef = useRef<HTMLPreElement | null>(null)
  const isSingleLine = useMemo(() => {
    const text = getNodeText(children)
    const withoutTrailingBreaks = text.replace(TRAILING_NEWLINES_RE, '')
    return !withoutTrailingBreaks.includes('\n')
  }, [children])

  const handleCopy = useCallback(async () => {
    const copyText
      = preRef.current?.querySelector('code')?.textContent
        ?? preRef.current?.textContent
        ?? ''

    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
    catch {
      setCopied(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative p-4">
      <ButtonGroup
        className={cn(
          'absolute right-2 z-raised',
          isSingleLine ? 'top-1/2 -translate-y-1/2' : 'top-2',
        )}
      >
        <Button
          type="button"
          size="icon-touch"
          aria-label={copied ? 'Copied code' : 'Copy code'}
          onClick={handleCopy}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </ButtonGroup>

      <pre
        ref={preRef}
        className={cn(
          'rounded-lg bg-panel pr-12 overflow-x-auto tracking-wide',
          className,
          isSingleLine && 'py-2',
        )}
        {...props}
      >
        {children}
      </pre>
    </div>
  )
}
