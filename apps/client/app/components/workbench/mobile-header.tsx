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
import { WORKBENCH_CONFIGS } from './workbench-configs'

interface MobileHeaderProps {
  scope: MachineType
}

export function MobileHeader({ scope }: MobileHeaderProps) {
  const { value: editorValue, errors: editorErrors, setEditorValue } = useEditorState(scope)
  const compile = useCompile(scope)
  const machine = useCompiledMachine(scope)
  const { showAlert } = useAlert()
  const config = WORKBENCH_CONFIGS[scope]

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
    <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 bg-background/75 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0 shrink-0 max-w-[50%]">
        <LabelText as="h1" className="text-foreground truncate min-w-0">
          {machine?.name ?? 'workbench'}
        </LabelText>
        <Button
          onClick={handleShare}
          variant="embossed"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <StatusBadge
          status={editorErrors && editorErrors.length > 0 ? 'destructive' : 'success'}
          className="shrink-0"
        >
          {editorErrors && editorErrors.length > 0 ? '✗' : '✓'}
        </StatusBadge>

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

        {Object.keys(config.recipes).length > 0 && (
          <RecipeDropdown
            scope={scope}
            size="sm"
          />
        )}
      </div>
    </div>
  )
}
