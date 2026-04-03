import type { WorkbenchLogic } from './types'

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
        <button
          key={tab.id}
          onClick={() => requestTabChange(tab.id)}
          className={`tracking-wide text-xs transition-colors border-b-2 cursor-pointer ${
            activeTab === tab.id
              ? 'text-ctp-text border-ctp-mauve'
              : 'text-ctp-subtext0 border-transparent hover:text-ctp-text'
          }`}
        >
          {tab.id}
        </button>
      ))}
    </div>
  )
}
