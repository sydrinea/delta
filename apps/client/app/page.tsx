'use client'

import type { FeatureCardVariant } from '@/components/ui/feature-card'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Centered, GitHub } from '@/components'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '@/components/ui/feature-card'
import {
  shouldAnimateLoader,
  shouldTriggerNavigationLoader,
} from '@/lib/navigation-loader-config'
import deltaLogo from '../public/android-chrome-192x192.png'

interface FeatureBlock {
  title: string
  description: string
  href: string
  label: string
  variant: FeatureCardVariant
  external?: boolean
}

const blocks: FeatureBlock[] = [
  {
    title: 'NFA / DFA',
    description:
      'Build nondeterministic and deterministic finite automata with a fluent API. Step through execution, run test suites, and edit machines visually on the canvas.',
    href: '/nfa',
    label: 'open →',
    variant: 'sapphire',
  },
  {
    title: 'Turing Machines',
    description:
      'Single and multitape Turing machines with full step-through visualization. The transition table highlights the active rule at every step.',
    href: '/tm',
    label: 'open →',
    variant: 'blue',
  },
  {
    title: 'Quick Start',
    description:
      'Builder lifecycle, shared methods, the q() helper, and everything you need to write your first machine in under five minutes.',
    href: '/guide/quick-start',
    label: 'read →',
    variant: 'green',
    external: true,
  },
  {
    title: 'Demo',
    description:
      'A five-minute walkthrough of the main features — writing machines, stepping through execution, and building on the canvas.',
    href: 'https://www.youtube.com/watch?v=zOM9aVSUVi0',
    label: 'watch →',
    variant: 'red',
    external: true,
  },
]

export default function Home() {
  const pathname = usePathname()

  const handleNavigationStart = (href: string) => {
    if (pathname === href)
      return
    if (!shouldTriggerNavigationLoader(href))
      return

    window.dispatchEvent(
      new CustomEvent('delta:navigation-start', {
        detail: { to: href, animate: shouldAnimateLoader(href) },
      }),
    )
  }

  return (
    <Centered>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <Image
            src={deltaLogo}
            alt="Delta logo"
            className="mx-auto mb-10"
            width={72}
            height={72}
          />
          <h1 className="text-ctp-text text-3xl font-bold mb-4 leading-tight">
            design, test, and visualize automata
          </h1>
          <p className="text-ctp-subtext0 max-w-md mx-auto leading-relaxed font-sans">
            A code-first environment for finite automata and Turing machines.
            Write machines as TypeScript, run test suites, and step through
            execution visually.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-10">
          {blocks.map(block => (
            <FeatureCard
              key={block.title}
              {...block}
              onClick={() => block.external || handleNavigationStart(block.href)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="embossed"
            size="icon-sm"
            aria-label="View on GitHub"
          >
            <a href="https://github.com/sydrinea/delta" target="_blank" rel="noopener noreferrer">
              <GitHub className="w-5 h-5" />
            </a>
          </Button>
        </div>
      </div>
    </Centered>
  )
}
