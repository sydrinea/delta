import Link from 'next/link'
import { Centered } from '@/components'

export default function Offline() {
  return (
    <Centered>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 m-5 text-center">
        <p className="text-ctp-overlay0 font-mono text-sm">offline</p>
        <h1 className="text-ctp-text text-2xl font-bold">no connection</h1>
        <p className="text-ctp-subtext0 text-sm">
          you're offline and this page isn't cached yet
        </p>
        <Link
          href="/nfa"
          className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust transition-colors mt-2"
        >
          delta still works — try the editor
        </Link>
      </div>
    </Centered>
  )
}
