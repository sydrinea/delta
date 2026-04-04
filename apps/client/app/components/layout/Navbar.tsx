'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  shouldAnimateLoader,
  shouldTriggerNavigationLoader,
} from '@/lib/navigation-loader-config'
import { version } from '../../../package.json'
import { Badge } from '../ui/badge'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar'
import { NAVBAR_GROUPS, NAVBAR_MOBILE_ITEMS } from './navbar-config'

function MadeBy() {
  return (
    <a
      href="https://github.com/sydrinea"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-ctp-overlay1 hover:text-ctp-text transition-colors text-xs"
    >
      made with
      {' '}
      <Heart className="w-3 h-3 text-ctp-pink" fill="currentColor" />
      {' '}
      by
      @sydrinea
    </a>
  )
}

function NavbarContent() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const isActiveHref = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  const handleNavigationStart = (href: string) => {
    if (pathname === href)
      return
    if (!shouldTriggerNavigationLoader(href))
      return

    window.dispatchEvent(
      new CustomEvent('delta:navigation-start', {
        detail: {
          to: href,
          animate: shouldAnimateLoader(href),
        },
      }),
    )
  }

  const handleMobileNavigate = (href: string) => {
    handleNavigationStart(href)
    if (isMobile)
      setOpenMobile(false)
  }

  return (
    <>
      <header className="sticky top-0 z-sticky h-14 w-full shrink-0 border-b border-ctp-surface0 bg-ctp-base/75 backdrop-blur-md">
        <div className="hidden md:flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" onClick={() => handleNavigationStart('/')}>
              <Badge variant="ghost" className="font-bold tracking-widest uppercase px-3">
                delta
              </Badge>
            </Link>

            <NavigationMenu viewport={false}>
              <NavigationMenuList className="gap-1">
                {NAVBAR_GROUPS.map(group => (
                  <NavigationMenuItem key={group.heading}>
                    <NavigationMenuTrigger
                      className={group.items.some(item => isActiveHref(item.href))
                        ? 'text-ctp-text bg-ctp-surface0/50'
                        : 'text-ctp-subtext0 hover:text-ctp-text'}
                    >
                      {group.heading}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="min-w-44 space-y-1 p-1">
                        {group.items.map(item => (
                          <li key={item.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={item.href}
                                onClick={() => handleNavigationStart(item.href)}
                                className={isActiveHref(item.href)
                                  ? 'bg-ctp-surface0/60 text-ctp-text'
                                  : 'text-ctp-subtext0 hover:text-ctp-text'}
                              >
                                {item.label}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-1.5">
            <MadeBy />
            <span className="text-ctp-overlay1 text-xs">·</span>
            <Badge variant="info">
              v
              {version}
            </Badge>
          </div>
        </div>

        <div className="grid h-full grid-cols-3 items-center px-6 md:hidden">
          <div className="flex justify-start">
            <SidebarTrigger variant="ghost" size="icon-sm" className="text-ctp-text" />
          </div>

          <div className="flex justify-center">
            <Link href="/" onClick={() => handleNavigationStart('/')}>
              <Badge variant="ghost" className="font-bold tracking-widest uppercase px-3">
                delta
              </Badge>
            </Link>
          </div>

          <div className="flex justify-end"></div>
        </div>
      </header>

      <Sidebar side="left" variant="sidebar" collapsible="offcanvas" className="md:hidden">
        <SidebarHeader className="border-b border-ctp-subtext0/25 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-ctp-subtext0 uppercase">
              Menu
            </span>
            <Badge variant="info">
              v
              {version}
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarMenu>
            {NAVBAR_MOBILE_ITEMS.map((item) => {
              const isActive = isActiveHref(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-auto rounded-lg px-3 py-2.5 text-sm text-ctp-subtext0 hover:bg-ctp-surface0/60 hover:text-ctp-text data-[active=true]:bg-ctp-surface0 data-[active=true]:text-ctp-text"
                  >
                    <Link href={item.href} onClick={() => handleMobileNavigate(item.href)}>
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>

          <div className="mt-6 px-3">
            <MadeBy />
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  )
}

export default function Navbar() {
  return (
    <SidebarProvider defaultOpen={false} className="contents">
      <NavbarContent />
    </SidebarProvider>
  )
}
