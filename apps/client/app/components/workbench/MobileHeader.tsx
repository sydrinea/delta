'use client'

import type { WorkbenchHeaderLogic, WorkbenchMachine } from './types'
import { Check, Share2 } from 'lucide-react'
import { Button } from '../ui/button'
import { WithTooltip } from '../ui/tooltip'
import { RecipeDropdown } from './RecipeDropdown'

interface MobileHeaderProps<M extends WorkbenchMachine> {
  logic: WorkbenchHeaderLogic<M>
}

export function MobileHeader<M extends WorkbenchMachine>({ logic }: MobileHeaderProps<M>) {
  const {
    machine,
    editorValue,
    compile,
    editorErrors,
    handleShare,
    copied,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
  } = logic

  return (
    <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 bg-ctp-base/75 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0 shrink-0 max-w-[50%]">
        <h1 className="text-ctp-text text-xs font-bold uppercase tracking-widest truncate min-w-0">
          {machine?.name ?? 'untitled'}
        </h1>
        <Button
          onClick={handleShare}
          variant="embossed"
          size="icon-sm"
          className="text-ctp-overlay0 hover:text-ctp-text shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span
          className={`text-xs font-bold shrink-0 ${
            editorErrors && editorErrors.length > 0 ? 'text-ctp-red' : 'text-ctp-green'
          }`}
        >
          {editorErrors && editorErrors.length > 0 ? '✗' : '✓'}
        </span>

        <WithTooltip shortcut={['cmd', 's']}>
          <Button
            onClick={() => compile(editorValue)}
            variant="secondary"
            size="xs"
            className="shrink-0"
          >
            compile
          </Button>
        </WithTooltip>

        {recipeEntries.length > 0 && (
          <RecipeDropdown
            recipeEntries={recipeEntries}
            selectedRecipeKey={selectedRecipeKey}
            applyRecipe={applyRecipe}
            selectedRecipeLabel={selectedRecipeLabel}
            size="sm"
          />
        )}
      </div>
    </div>
  )
}
