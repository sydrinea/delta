import type { ComponentType } from 'react'
import type { TabId } from '@/components/workbench/types'
import type { MachineType } from '@/lib/worker/protocol'
import { slugToRecipeKey } from '@/lib/recipeSlug'

export interface WorkbenchProps {
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}

function MachinePageShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col flex-1 h-full overflow-hidden">
      {children}
    </section>
  )
}

export function MachinePage({ Component }: { Component: ComponentType<WorkbenchProps> }) {
  return (
    <MachinePageShell>
      <Component />
    </MachinePageShell>
  )
}

export async function MachineDebugPage({
  machineType,
  Component,
  params,
}: {
  machineType: MachineType
  Component: ComponentType<WorkbenchProps>
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const [exampleSlug, encodedInput] = slug ?? []
  const initialRecipe = exampleSlug
    ? slugToRecipeKey(machineType, exampleSlug) ?? undefined
    : undefined
  const initialInput = encodedInput ? decodeURIComponent(encodedInput) : undefined

  return (
    <MachinePageShell>
      <Component initialTab="debug" initialRecipe={initialRecipe} initialInput={initialInput} />
    </MachinePageShell>
  )
}
