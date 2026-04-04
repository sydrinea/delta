import { NAV } from '../../guide/nav'

export interface NavbarItem {
  label: string
  href: string
}

export interface NavbarGroup {
  heading: string
  items: NavbarItem[]
}

const guidePages = new Map(NAV.flatMap(section => section.pages).map(page => [page.id, page.label]))

const quickStartLabel = guidePages.get('quick-start') ?? 'Quick Start'
const apiReferenceLabel = guidePages.get('api') ?? 'API Reference'

export const NAVBAR_GROUPS: NavbarGroup[] = [
  {
    heading: 'Automata',
    items: [
      { label: 'NFA / DFA', href: '/nfa' },
      { label: 'PDA', href: '/pda' },
      { label: 'TM', href: '/tm' },
    ],
  },
  {
    heading: 'Guide',
    items: [
      { label: quickStartLabel, href: '/guide' },
      { label: apiReferenceLabel, href: '/guide/api' },
    ],
  },
]

export const NAVBAR_MOBILE_ITEMS: NavbarItem[] = NAVBAR_GROUPS.flatMap(group => group.items)
