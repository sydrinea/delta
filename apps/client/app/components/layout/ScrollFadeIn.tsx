'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollFadeInProps {
  children: React.ReactNode
  className?: string
}

export default function ScrollFadeIn({ children, className }: ScrollFadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el)
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${visible ? 'animate-in fade-in slide-in-from-bottom-15 duration-1000' : 'opacity-0'} ${className ?? ''}`}>
      {children}
    </div>
  )
}
