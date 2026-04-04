import type { WorkbenchLogic } from './types'
import { Button } from '../ui/button'

interface TabSwitcherProps<M extends { name?: string }> {
  logic: WorkbenchLogic<M>
}

export function TabSwitcher<M extends { name?: string }>({
  logic,
}: TabSwitcherProps<M>) {
  const { activeTab, requestTabChange, visibleTabs } = logic

  return (
    <div className="flex items-center gap-4 shrink-0 border-b border-ctp-surface0 pb-2">
      {visibleTabs.map(tab => (
        <Button
          key={tab.id}
          onClick={() => requestTabChange(tab.id)}
          variant="ghost"
          size="xs"
          className={`border-b-2 px-0 ${
            activeTab === tab.id
              ? 'text-ctp-text border-ctp-mauve'
              : 'text-ctp-subtext0 border-transparent hover:text-ctp-text'
          }`}
        >
          {tab.id}
        </Button>
      ))}
    </div>
  )
}
