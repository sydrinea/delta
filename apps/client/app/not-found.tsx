import Link from 'next/link'
import { Centered } from '@/components'

export default function NotFound() {
  return (
    <Centered>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 m-5 text-center">
        <p className="text-ctp-overlay0 font-mono text-sm">404</p>
        <h1 className="text-ctp-text text-2xl font-bold">page not found</h1>
        <p className="text-ctp-subtext0 text-sm">this page doesn't exist</p>
        <Link
          href="/"
          className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust transition-colors mt-2"
        >
          find your way home
        </Link>
      </div>
    </Centered>
  )
}
