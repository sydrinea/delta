import type { MachineType } from '@/lib/worker/protocol'
import { notFound } from 'next/navigation'
import { Workbench } from '@/components/workbench'

export default async function MachineCanvasPage({ params }: PageProps<'/[machine]/canvas'>) {
  const { machine } = await params
  if (machine !== 'nfa') {
    notFound()
  }

  return (
    <section className="flex flex-col flex-1 h-full overflow-hidden">
      <Workbench scope={machine as MachineType} initialTab="canvas" />
    </section>
  )
}
