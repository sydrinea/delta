'use client'

import type { WindowMockTab } from '@/components/ui/window-mock'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitHub, ScrollFadeIn } from '@/components'
import Footer from '@/components/layout/footer'
import { AnnouncementBadge } from '@/components/ui/announcement-badge'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '@/components/ui/feature-card'
import { TestSuitePreview } from '@/components/ui/test-suite'
import { WindowMock } from '@/components/ui/window-mock'
import { Heading, Text, LabelText, Badge } from '@/components/ui'
import { Trace } from '@/components/visualize'
import { useSimulatorStore } from '@/store/simulator-store'
import { useAutomataStore } from '@/store/automata-store'
import { endsInAb } from '@delta/examples'
import {
  shouldAnimateLoader,
  shouldTriggerNavigationLoader,
} from '@/lib/navigation-loader-config'
import { useEffect } from 'react'

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
    variant: 'pink' as const,
    name: 'NFA & DFA',
    description: 'Nondeterministic and deterministic finite automata. Build with the TypeScript API or a visual canvas editor.',
    href: '/nfa',
    linkClass: 'text-pink-500 hover:text-pink-500/80',
  },
  {
    tag: 'context-free',
    variant: 'lavender' as const,
    name: 'PDA',
    description: 'Pushdown automata with full stack visualization. Model context-free languages and watch each push and pop in real time.',
    href: '/pda',
    linkClass: 'text-primary hover:text-primary/80',
  },
  {
    tag: 'recursively enumerable',
    variant: 'teal' as const,
    name: 'Turing Machine',
    description: 'Single and multitape Turing machines. The transition table highlights the active rule at every step.',
    href: '/tm',
    linkClass: 'text-teal-500 hover:text-teal-500/80',
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
  useEffect(() => {
    useSimulatorStore.getState().setInput('aabab')
    useAutomataStore.getState().patch('nfa', { machine: endsInAb })
    
    const interval = setInterval(() => {
      const { step, trace, setStep } = useSimulatorStore.getState()
      if (!trace || trace.length === 0) return
      if (step >= trace.length - 1) {
        setStep(0)
      } else {
        setStep(step + 1)
      }
    }, 500)

    return () => {
      clearInterval(interval)
      useSimulatorStore.getState().reset()
      useAutomataStore.getState().patch('nfa', { machine: null })
    }
  }, [])

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
              <Heading as="h1" variant="h1">
                design automata as
                <br />
                <span className="text-primary">software</span>
              </Heading>

              <Text variant="lead">
                Delta is a code-first environment for building and testing finite automata and Turing machines in TypeScript.
              </Text>

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
                        <div className="relative w-full h-[350px] overflow-hidden bg-background rounded-b-lg">
                          <div className="absolute inset-0 origin-top-left w-[125%] h-[125%] scale-80 pointer-events-none">
                            <div className="h-full w-full [&>div]:border-none! [&>div]:bg-transparent! [&>div]:shadow-none!">
                              <Trace scope="nfa" readonly={true} />
                            </div>
                          </div>
                        </div>
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
          <LabelText className="mb-3 block text-primary">
            features
          </LabelText>
          <Heading as="h2" variant="h2">
            Modeled after an IDE
          </Heading>
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

      <section className="bg-panel border-y border-panel-border py-20">
        <ScrollFadeIn className={CONTAINER}>
          <LabelText className="mb-3 block text-primary">
            machine types
          </LabelText>
          <Heading as="h2" variant="h2">
            Chomsky's hierarchy
          </Heading>
          <div className="grid grid-cols-1 min-[700px]:grid-cols-3 gap-5">
            {machines.map(m => (
              <div
                key={m.name}
                className="border border-muted rounded-lg p-6 bg-background hover:border-panel-border transition-colors flex flex-col"
              >
                <Badge variant={m.variant} className="mb-4">
                  {m.tag}
                </Badge>
                <Heading as="h3" variant="h3">{m.name}</Heading>
                <Text variant="muted" className="mb-5 flex-1">{m.description}</Text>
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
            <LabelText className="mb-3 block text-primary">
              correctness
            </LabelText>
            <Heading as="h2" variant="h2">
              Test your machines
            </Heading>
            <ul className="space-y-4 text-sm text-muted-foreground font-sans leading-relaxed">
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

      <section className="bg-primary/15 border-y border-primary/25 py-20 text-center">
        <ScrollFadeIn className={CONTAINER}>
          <Heading as="h2" variant="h3">
            Ready to dive in?
          </Heading>
          <Text variant="code" className="mb-5 text-muted-foreground">Write your first automaton in minutes.</Text>
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
