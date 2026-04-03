'use client'

import { Workbench } from '@/components'

export default function Page() {
  return (
    <section className="flex flex-1 min-h-0 md:flex-col md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      <Workbench.NFA />
    </section>
  )
}
