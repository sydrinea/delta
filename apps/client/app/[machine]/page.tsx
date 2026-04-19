import type { MachineType } from '@/lib/worker/protocol'
import { notFound } from 'next/navigation'
import { Workbench } from '@/components/workbench'

export default async function MachinePage({ params }: PageProps<'/[machine]'>) {
  const { machine } = await params
  if (machine !== 'nfa' && machine !== 'pda' && machine !== 'tm') {
    notFound()
  }

  return (
    <section className="flex flex-col flex-1 h-full overflow-hidden">
      <Workbench scope={machine as MachineType} />
    </section>
  )
}
