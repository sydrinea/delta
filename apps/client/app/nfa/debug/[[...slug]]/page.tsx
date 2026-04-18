import { Workbench } from '@/components'
import { MachineDebugPage } from '@/lib/machine-pages'

export default function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <MachineDebugPage machineType="nfa" Component={Workbench.NFA} params={params} />
}
