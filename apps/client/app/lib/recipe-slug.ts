import type { MachineType } from '@/lib/worker/protocol'
import { recipes } from '@delta/examples/recipes'

const RE = /\/([^/]+)\.ts$/

function pathToSlug(path: string): string {
  return path.match(RE)?.[1] ?? ''
}

export function slugToRecipeKey(machineType: MachineType, slug: string): string | null {
  const map = recipes[machineType]
  return Object.keys(map).find(key => pathToSlug(map[key].path) === slug) ?? null
}

export function recipeKeyToSlug(machineType: MachineType, key: string): string | null {
  const recipe = recipes[machineType]?.[key]
  return recipe ? pathToSlug(recipe.path) : null
}
