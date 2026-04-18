'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface RecipeDropdownProps {
  recipeEntries: [string, { label: string }][]
  selectedRecipeKey: string
  applyRecipe: (key: string) => void
  selectedRecipeLabel: string
  className?: string
  size: 'default' | 'sm' | 'lg'
}

export function RecipeDropdown({
  recipeEntries,
  selectedRecipeKey,
  applyRecipe,
  selectedRecipeLabel,
  className = '',
  size = 'lg',
}: RecipeDropdownProps) {
  if (recipeEntries.length === 0)
    return null

  return (
    <div className={`min-w-0 ${className}`}>
      <Select
        value={selectedRecipeKey}
        onValueChange={applyRecipe}
      >
        <SelectTrigger
          size={size}
          className="ml-auto w-auto max-w-full min-w-0 **:data-[slot=select-value]:max-w-full **:data-[slot=select-value]:overflow-hidden **:data-[slot=select-value]:text-ellipsis **:data-[slot=select-value]:whitespace-nowrap"
        >
          <SelectValue placeholder={selectedRecipeLabel} />
        </SelectTrigger>
        <SelectContent align="end" position="popper">
          {recipeEntries.map(([key, recipe]) => (
            <SelectItem key={key} value={key}>
              {recipe.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
