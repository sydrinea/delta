'use client'

import { Workbench } from '@/components'

export default function TMPage() {
  return (
    <section className="flex flex-col flex-1 min-h-0 h-[calc(100dvh-3.5rem)] overflow-hidden">
      <Workbench.TM />
    </section>
  )
}
