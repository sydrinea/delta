'use client'

import type { Heading } from '../../guide/nav'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NAV } from '../../guide/nav'
import { GitHub } from '../icons'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '../ui/navigation/sidebar'
import { Button } from '../ui/primitives/button'

interface ToCProps {
  headings: Heading[]
  activeId: string
  onNavigate: (id: string) => void
}

function TableOfContents({ headings, activeId, onNavigate }: ToCProps) {
  if (!headings.length)
    return null

  return (
    <nav className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ctp-overlay0 mb-2 px-1">
        On this page
      </p>
      {headings.map(h => (
        <a
          key={h.id}
          href={`#${h.id}`}
          onClick={() => onNavigate(h.id)}
          className={[
            'block text-[13px] leading-snug py-0.5 rounded transition-colors duration-150',
            h.level === 1
              ? 'pl-1 font-medium'
              : h.level === 2
                ? 'pl-3'
                : 'pl-5 text-[12px]',
            activeId === h.id
              ? 'text-ctp-lavender font-semibold'
              : 'text-ctp-subtext0 hover:text-ctp-text',
          ].join(' ')}
        >
          {h.text}
        </a>
      ))}
    </nav>
  )
}

interface SidebarContentProps {
  activePage: string
  onNavigate: (id: string) => void
}

function GuideSidebarNav({ activePage, onNavigate }: SidebarContentProps) {
  const getGuideHref = (id: string) => (id === 'quick-start' ? '/guide' : `/guide/${id}`)

  return (
    <div className="py-3 px-2 space-y-3">
      {NAV.map(group => (
        <SidebarGroup key={group.section} className="px-2 py-1">
          <SidebarGroupLabel className="h-auto px-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ctp-overlay0">
            {group.section}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.pages.map((page) => {
                const isActive = activePage === page.id
                return (
                  <SidebarMenuItem key={page.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-auto rounded-lg px-2 py-1.5 text-xs text-ctp-subtext0 hover:bg-ctp-surface0/60 hover:text-ctp-text data-[active=true]:bg-ctp-surface0 data-[active=true]:text-ctp-text data-[active=true]:font-semibold"
                    >
                      <Link href={getGuideHref(page.id)} onClick={() => onNavigate('')}>
                        {page.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  )
}

interface GuideLayoutProps {
  activePage: string
  content: React.ReactNode
  headings: Heading[]
  editUrl: string
  issueUrl: string
  previousPage: { label: string, href: string } | null
  nextPage: { label: string, href: string } | null
}

function GuideShell({
  activePage,
  content,
  headings,
  editUrl,
  issueUrl,
  previousPage,
  nextPage,
}: GuideLayoutProps) {
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id ?? '')
  const { isMobile, setOpenMobile } = useSidebar()

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = contentRef.current
    if (!root)
      return

    const handleHeadingClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const heading = target.closest('h1, h2, h3') as HTMLElement | null
      if (!heading?.id)
        return

      setActiveHeading(heading.id)

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      heading.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })

      window.history.replaceState(
        null,
        '',
        `#${encodeURIComponent(heading.id)}`,
      )
    }

    root.addEventListener('click', handleHeadingClick)
    return () => root.removeEventListener('click', handleHeadingClick)
  }, [content, headings])

  const navigate = useCallback((id: string) => {
    setActiveHeading(id)
    if (isMobile)
      setOpenMobile(false)
  }, [isMobile, setOpenMobile])

  return (
    <>
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="offcanvas"
        className="md:top-14 md:h-[calc(100svh-3.5rem)]"
      >
        <SidebarHeader className="border-b border-ctp-surface0 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-ctp-subtext0 uppercase">
            Guide
          </p>
        </SidebarHeader>
        <SidebarContent className="pb-6">
          <GuideSidebarNav activePage={activePage} onNavigate={navigate} />
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-ctp-base">
        <div className="sticky top-14 z-raised border-b border-ctp-surface0 bg-ctp-base/75 backdrop-blur-md md:hidden">
          <div className="flex items-center px-4 py-2">
            <SidebarTrigger variant="ghost" size="icon-sm" className="text-ctp-text" />
            <span className="ml-2 text-xs font-semibold tracking-wide text-ctp-subtext0 uppercase">
              Guide
            </span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl items-start">
          <main className="flex-1 min-w-0 px-6 py-10 lg:px-12">
            <div ref={contentRef} className="mx-auto max-w-2xl">
              <article
                className="prose doc-prose"
              >
                {content}
              </article>

              <footer className="mt-12 border-t border-ctp-surface0 pt-6 pb-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="secondary" size="xs">
                    <a
                      href={editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GitHub className="w-3.5 h-3.5" />
                      Edit on GitHub
                    </a>
                  </Button>
                  <Button asChild variant="destructive" size="xs">
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GitHub className="w-3.5 h-3.5" />
                      Report issue
                    </a>
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {previousPage
                    ? (
                        <Link
                          href={previousPage.href}
                          onClick={() => navigate('')}
                          className="rounded-lg border border-ctp-surface1 bg-ctp-mantle/70 px-3 py-2 text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors"
                        >
                          <span className="block text-[10px] uppercase tracking-widest text-ctp-overlay0">
                            Previous
                          </span>
                          <span className="block mt-0.5 font-semibold">
                            {previousPage.label}
                          </span>
                        </Link>
                      )
                    : (
                        <div />
                      )}

                  {nextPage
                    ? (
                        <Link
                          href={nextPage.href}
                          onClick={() => navigate('')}
                          className="rounded-lg border border-ctp-surface1 bg-ctp-mantle/70 px-3 py-2 text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors sm:text-right"
                        >
                          <span className="block text-[10px] uppercase tracking-widest text-ctp-overlay0">
                            Next
                          </span>
                          <span className="block mt-0.5 font-semibold">
                            {nextPage.label}
                          </span>
                        </Link>
                      )
                    : (
                        <div />
                      )}
                </div>
              </footer>
            </div>
          </main>

          <aside className="hidden xl:block w-52 shrink-0 self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10 px-4 bg-ctp-base/75 backdrop-blur-md">
            <TableOfContents
              headings={headings.slice(1)}
              activeId={activeHeading}
              onNavigate={navigate}
            />
          </aside>
        </div>
      </SidebarInset>
    </>
  )
}

export default function Guide(props: GuideLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '14rem',
          '--sidebar-width-mobile': '18rem',
        } as React.CSSProperties
      }
    >
      <GuideShell {...props} />
    </SidebarProvider>
  )
}
