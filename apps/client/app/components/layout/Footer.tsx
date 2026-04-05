import Image from 'next/image'
import Link from 'next/link'
import { GitHub } from '@/components'
import { Button } from '@/components/ui/button'
import deltaLogo from '../../../public/android-chrome-192x192.png'

const footerLinks = [
  { label: 'NFA & DFA', href: '/nfa' },
  { label: 'PDA', href: '/pda' },
  { label: 'Turing Machines', href: '/tm' },
  { label: 'Guide', href: '/guide' },
]

export default function Footer() {
  return (
    <footer className="bg-ctp-mantle border-t border-ctp-surface0 px-6 py-5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-ctp-subtext0 hover:text-ctp-text transition-colors">
          <Image src={deltaLogo} alt="Delta logo" width={20} height={20} className="opacity-80" />
          <span className="text-xs font-semibold font-mono tracking-widest uppercase leading-none">delta</span>
        </Link>

        <nav className="flex items-center gap-5">
          {footerLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-ctp-subtext0 hover:text-ctp-text transition-colors font-sans"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-ctp-subtext0">
          <Button asChild variant="embossed" size="icon-sm" aria-label="View on GitHub">
            <a href="https://github.com/sydrinea/delta" target="_blank" rel="noopener noreferrer">
              <GitHub className="w-4 h-4" />
            </a>
          </Button>
          <span className="text-xs font-mono">MIT license</span>
        </div>
      </div>
    </footer>
  )
}
