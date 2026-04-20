'use client'

import type { MachineType } from '@/lib/worker/protocol'
import { Check, Share2 } from 'lucide-react'
import { useCompile } from '@/hooks/use-compile'
import { useCompiledMachine } from '@/hooks/use-compiled-machine'
import { useEditorState } from '@/hooks/use-editor-state'
import { useMachineShare } from '@/hooks/use-machine-share'
import { useAlert } from '../providers'
import { LabelText } from '../ui'
import { StatusBadge } from '../ui/feedback/status-badge'
import { WithTooltip } from '../ui/overlays/tooltip'
import { Button } from '../ui/primitives/button'
import { RecipeDropdown } from './recipe-dropdown'

interface WorkbenchHeaderProps {
  scope: MachineType
}

export function WorkbenchHeader({ scope }: WorkbenchHeaderProps) {
  const { value: editorValue, errors: editorErrors, setEditorValue } = useEditorState(scope)
  const compile = useCompile(scope)
  const machine = useCompiledMachine(scope)
  const { showAlert } = useAlert()

  const { copied, handleShare } = useMachineShare({
    machineType: scope,
    code: editorValue,
    canShare: machine !== null,
    onLoadCode: (code) => {
      setEditorValue(code)
      compile(code)
    },
    onShareError: () => {
      showAlert({
        title: 'Share Failed',
        message: 'Could not generate a share link right now. Please try again later.',
      })
    },
  })

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
        <StatusBadge
          status={editorErrors && editorErrors.length > 0 ? 'destructive' : 'success'}
          className="px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
        >
          {editorErrors && editorErrors.length > 0 ? '✗ check errors' : '✓ valid'}
        </StatusBadge>
      </div>

      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <LabelText as="h1" className="text-foreground lg:text-end max-w-40 md:max-w-56 xl:max-w-80 text-nowrap overflow-x-auto">
            {machine?.name ?? 'untitled'}
          </LabelText>
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
            scope={scope}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
