'use client'

import { Workbench } from '@/components'
import { MachinePage } from '@/lib/machine-pages'

export default function Page() {
  return <MachinePage Component={Workbench.TM} />
}
