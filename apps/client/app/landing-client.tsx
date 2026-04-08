'use client'

import type { WindowMockTab } from '@/components/ui/window-mock'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { GitHub, ScrollFadeIn } from '@/components'
import Footer from '@/components/layout/Footer'
import { AnnouncementBadge } from '@/components/ui/announcement-badge'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '@/components/ui/feature-card'
import { TestSuitePreview } from '@/components/ui/TestSuite'
import { WindowMock } from '@/components/ui/window-mock'
import {
  shouldAnimateLoader,
  shouldTriggerNavigationLoader,
} from '@/lib/navigation-loader-config'

interface LandingClientProps {
  children?: React.ReactNode
}

const features = [
  {
    title: 'Fluent TypeScript API',
    description: 'Define machines with a chainable builder. Errors surface at compile time, right in the editor.',
    variant: 'red' as const,
  },
  {
    title: 'Step-Through Visualizer',
    description: 'Watch your machine process input state by state. The active transition highlights at every step.',
    variant: 'peach' as const,
  },
  {
    title: 'Inline Test Suites',
    description: 'Pair any machine with a test suite. Delta runs them all and reports pass/fail right next to your code.',
    variant: 'green' as const,
  },
  {
    title: 'NFA to DFA Conversion',
    description: 'Convert any NFA via subset construction and see how they relate with semantic state names.',
    variant: 'blue' as const,
  },
  {
    title: 'Shareable URLs',
    description: 'Every machine can be turned into a URL. Share machines with a link — no hoops required.',
    variant: 'sapphire' as const,
  },
  {
    title: 'Thompson\'s Construction',
    description: 'Build NFAs from regular expressions with a stack-based API mirroring union, concat, and Kleene star.',
    variant: 'mauve' as const,
  },
]

const machines = [
  {
    tag: 'regular',
    tagClass: 'text-ctp-pink bg-ctp-pink/10',
    name: 'NFA & DFA',
    description: 'Nondeterministic and deterministic finite automata. Build with the TypeScript API or a visual canvas editor.',
    href: '/nfa',
    linkClass: 'text-ctp-pink hover:text-ctp-pink/80',
  },
  {
    tag: 'context-free',
    tagClass: 'text-ctp-lavender bg-ctp-lavender/10',
    name: 'PDA',
    description: 'Pushdown automata with full stack visualization. Model context-free languages and watch each push and pop in real time.',
    href: '/pda',
    linkClass: 'text-ctp-lavender hover:text-ctp-lavender/80',
  },
  {
    tag: 'recursively enumerable',
    tagClass: 'text-ctp-teal bg-ctp-teal/10',
    name: 'Turing Machine',
    description: 'Single and multitape Turing machines. The transition table highlights the active rule at every step.',
    href: '/tm',
    linkClass: 'text-ctp-teal hover:text-ctp-teal/80',
  },
]

const CONTAINER = 'px-4 sm:px-8 max-w-6xl mx-auto w-full'

const announcement: { label: string, href?: string, variant?: React.ComponentProps<typeof AnnouncementBadge>['variant'] } | null = {
  label: 'Watch the demo on YouTube',
  href: 'https://youtu.be/zOM9aVSUVi0',
  variant: 'rainbow',
}

export default function LandingClient({ children }: LandingClientProps) {
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
    <div className="w-full overflow-x-hidden">
      <section className="min-h-[calc(100vh-3.5rem)] flex flex-col hero-grid relative">
        {announcement && (
          <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <AnnouncementBadge {...announcement} />
            </div>
          </div>
        )}
        <div className={`${CONTAINER} flex-1 flex items-center py-16 sm:py-20`}>
          <div className="w-full pt-6 sm:pt-0 grid grid-cols-1 min-[860px]:grid-cols-2 gap-10 items-center animate-in fade-in slide-in-from-bottom-15 duration-1000">
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight text-ctp-text">
                design automata as
                <br />
                <span className="text-ctp-sky">software</span>
              </h1>

              <p className="font-sans text-sm md:text-md leading-relaxed text-ctp-subtext1 max-w-md">
                Delta is a code-first environment for building and testing finite automata and Turing machines in TypeScript.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Button asChild variant="accent" size="lg">
                  <Link href="/nfa" onClick={() => handleNavigationStart('/nfa')}>
                    Launch Delta
                  </Link>
                </Button>
                <Button asChild variant="embossed" size="lg">
                  <a href="https://github.com/sydrinea/delta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <GitHub className="w-4 h-4" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>

            <div className="min-w-0 w-full relative">
              <div
                aria-hidden="true"
                className="absolute -inset-1 blur-md bg-linear-to-br from-ctp-blue/30 via-ctp-lavender/20 to-ctp-sapphire"
              />
              <div className="relative">
                <WindowMock
                  className="h-96"
                  tabs={[
                    {
                      value: 'code',
                      label: 'code',
                      content: (
                        <div className="text-[11pt]">
                          {children}
                        </div>
                      ),
                    },
                    {
                      value: 'debug',
                      label: 'debug',
                      content: (
                        <video autoPlay muted loop playsInline className="w-full">
                          <source src="/debug-video-light.mp4" media="(prefers-color-scheme: light)" />
                          <source src="/debug-video.mov" />
                        </video>
                      ),
                    },
                  ] satisfies WindowMockTab[]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pb-6 flex justify-center">
          <Button
            variant="embossed"
            size="icon-sm"
            aria-label="Scroll to features"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <section id="features" className="py-20">
        <ScrollFadeIn className={CONTAINER}>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold  text-ctp-sky font-sans">
            features
          </div>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ctp-text mb-12">
            Modeled after an IDE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 min-[900px]:grid-cols-3 gap-3">
            {features.map(f => (
              <FeatureCard
                key={f.title}
                {...f}
              />
            ))}
          </div>
        </ScrollFadeIn>
      </section>

      <section className="bg-ctp-mantle border-y border-ctp-surface0 py-20">
        <ScrollFadeIn className={CONTAINER}>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold  text-ctp-sky font-sans">
            machine types
          </div>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ctp-text mb-12">
            Chomsky's hierarchy
          </h2>
          <div className="grid grid-cols-1 min-[700px]:grid-cols-3 gap-5">
            {machines.map(m => (
              <div
                key={m.name}
                className="border border-ctp-surface1 rounded-lg p-6 bg-ctp-base hover:border-ctp-surface2 transition-colors flex flex-col"
              >
                <span className={`inline-block w-fit text-xs font-mono font-semibold px-2 py-0.5 rounded mb-4 ${m.tagClass}`}>
                  {m.tag}
                </span>
                <h3 className="font-sans text-[clamp(1.1rem,2.5vw,1.25rem)] font-bold text-ctp-text mb-3">{m.name}</h3>
                <p className="text-sm leading-relaxed text-ctp-subtext0 mb-5 font-sans flex-1">{m.description}</p>
                <Link
                  href={m.href}
                  onClick={() => handleNavigationStart(m.href)}
                  className={`text-sm font-bold font-mono inline-flex items-center gap-1 transition-colors ${m.linkClass}`}
                >
                  Open
                  {' '}
                  {m.name}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </ScrollFadeIn>
      </section>

      <section className="py-20">
        <ScrollFadeIn className={`${CONTAINER} grid grid-cols-1 min-[860px]:grid-cols-2 gap-12 items-center`}>
          <div>
            <div className="mb-3 flex items-center gap-2 text-lg font-bold  text-ctp-sky font-sans">
              correctness
            </div>
            <h2 className="font-serif text-4xl leading-12 font-bold tracking-tight text-ctp-text mb-6">
              Test your machines
            </h2>
            <ul className="space-y-4 text-sm text-ctp-subtext0 font-sans leading-relaxed">
              <li className="flex items-center gap-3">
                Compilation errors catch invalid transitions before you run anything.
              </li>
              <li className="flex items-center gap-3">
                Test suites make correctness verifiable — not just visually convincing.
              </li>
              <li className="flex items-center gap-3">
                Export test suites to share with instructors or collaborators.
              </li>
            </ul>
          </div>
          <TestSuitePreview
            className="p-4"
            rows={[
              { input: 'a', expected: false, passed: true },
              { input: 'aa', expected: true, passed: true },
              { input: 'aaa', expected: true, passed: true },
              { input: 'aaaa', expected: false, passed: true },
              { input: 'aaaaaa', expected: true, passed: true },
              { input: 'aaaaaaa', expected: false, passed: false },
            ]}
          />
        </ScrollFadeIn>
      </section>

      <section className="bg-ctp-lavender/15 border-y border-ctp-lavender/25 py-20 text-center">
        <ScrollFadeIn className={CONTAINER}>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-ctp-text mb-3">
            Ready to dive in?
          </h2>
          <p className="text-sm text-ctp-subtext0 font-mono mb-5">Write your first automaton in minutes.</p>
          <Button asChild variant="accent" size="lg">
            <Link href="/nfa" onClick={() => handleNavigationStart('/nfa')}>
              Launch Delta
            </Link>
          </Button>
        </ScrollFadeIn>
      </section>

      <Footer />
    </div>
  )
}
