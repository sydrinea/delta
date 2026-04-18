'use client'

import type { WorkbenchHeaderLogic, WorkbenchMachine } from './types'
import { Check, Share2 } from 'lucide-react'
import { Button } from '../ui/button'
import { WithTooltip } from '../ui/tooltip'
import { RecipeDropdown } from './RecipeDropdown'

interface WorkbenchHeaderProps<M extends WorkbenchMachine> {
  logic: WorkbenchHeaderLogic<M>
}

export function WorkbenchHeader<M extends WorkbenchMachine>({ logic }: WorkbenchHeaderProps<M>) {
  const {
    editorValue,
    compile,
    editorErrors,
    machine,
    handleShare,
    copied,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
  } = logic

  return (
    <div className="flex flex-col-reverse lg:flex-row justify-between gap-3 relative">
      <div className="flex items-center gap-y-3">
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
        <p
          className={`font-bold text-xs px-3 py-1 rounded-lg ${editorErrors && editorErrors.length > 0 ? 'text-ctp-red' : 'text-ctp-green'} transition-colors whitespace-nowrap`}
        >
          {editorErrors && editorErrors.length > 0
            ? '✗ check errors'
            : '✓ valid'}
        </p>
      </div>

      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <h1 className="text-ctp-text text-sm lg:text-end font-bold uppercase tracking-widest max-w-40 md:max-w-56 xl:max-w-80 text-nowrap overflow-x-auto">
            {machine?.name ?? 'untitled'}
          </h1>
          <WithTooltip label="Share Machine">
            <Button
              onClick={handleShare}
              variant="embossed"
              size="icon-sm"
            >
              {copied
                ? <Check className="w-4 h-4" />
                : <Share2 className="w-4 h-4" />}
            </Button>
          </WithTooltip>
        </div>

        <div className="md:hidden shrink-0">
          <RecipeDropdown
            recipeEntries={recipeEntries}
            selectedRecipeKey={selectedRecipeKey}
            applyRecipe={applyRecipe}
            selectedRecipeLabel={selectedRecipeLabel}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
