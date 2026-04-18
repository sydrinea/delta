import { notFound } from 'next/navigation'
import { Workbench } from '@/components/workbench'
import type { MachineType } from '@/lib/worker/protocol'
import { slugToRecipeKey } from '@/lib/recipe-slug'

export default async function MachineDebugPage({
  params,
}: {
  params: Promise<{ machine: string, slug?: string[] }>
}) {
  const { machine, slug } = await params
  if (machine !== 'nfa' && machine !== 'pda' && machine !== 'tm') {
    notFound()
  }

  const [exampleSlug, encodedInput] = slug ?? []
  const initialRecipe = exampleSlug
    ? slugToRecipeKey(machine as MachineType, exampleSlug) ?? undefined
    : undefined
  const initialInput = encodedInput ? decodeURIComponent(encodedInput) : undefined

  return (
    <section className="flex flex-col flex-1 h-full overflow-hidden">
      <Workbench 
        scope={machine as MachineType} 
        initialTab="debug" 
        initialRecipe={initialRecipe} 
        initialInput={initialInput} 
      />
    </section>
  )
}
