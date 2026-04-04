import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/app/lib/utils'

interface ResizablePersistence {
  id: string
  panelIds?: string[]
  storage?: ResizablePrimitive.LayoutStorage
  debounceSaveMs?: number
}

type ResizablePanelGroupProps = ResizablePrimitive.GroupProps & {
  persistence?: ResizablePersistence
}

function ResizablePanelGroup({
  className,
  persistence,
  defaultLayout,
  onLayoutChange,
  onLayoutChanged,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full overflow-hidden rounded-2xl aria-[orientation=vertical]:flex-col',
        className,
      )}
      onLayoutChange={onLayoutChange}
      onLayoutChanged={onLayoutChanged}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({ withHandle, ...props }: ResizablePrimitive.SeparatorProps & { withHandle?: boolean }) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className="outline-none! focus:outline-none! active:outline-none! bg-transparent! focus:bg-transparent! active:bg-transparent!"
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-1.5 shrink-0 rounded-full bg-ctp-surface0/50" />
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
