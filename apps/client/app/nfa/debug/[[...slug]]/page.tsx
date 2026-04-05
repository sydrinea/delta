import { Workbench } from '@/components'
import { slugToRecipeKey } from '@/lib/recipeSlug'

export default async function NFADebugPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const [exampleSlug, encodedInput] = slug ?? []
  const initialRecipe = exampleSlug ? slugToRecipeKey('nfa', exampleSlug) ?? undefined : undefined
  const initialInput = encodedInput ? decodeURIComponent(encodedInput) : undefined

  return (
    <section className="flex flex-col flex-1 h-full overflow-hidden">
      <Workbench.NFA initialTab="debug" initialRecipe={initialRecipe} initialInput={initialInput} />
    </section>
  )
}
