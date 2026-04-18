'use client'

import type { TabId, WorkbenchLogic, WorkbenchMachine } from './types'
import { ConfirmModal, TestSuite } from '../ui'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { GraphvizViewer } from '../visualize'
import { RecipeDropdown } from './RecipeDropdown'
import { WorkbenchHeader } from './WorkbenchHeader'

const TAB_LABELS: Partial<Record<TabId, string>> = {
  code: 'Code',
  debug: 'Debug',
  canvas: 'Canvas',
}

interface DesktopWorkbenchProps<M extends WorkbenchMachine> {
  logic: WorkbenchLogic<M>
}

export function DesktopWorkbench<M extends WorkbenchMachine>({ logic }: DesktopWorkbenchProps<M>) {
  const {
    activeTab,
    requestTabChange,
    visibleTabs,
    activeTabContent,
    recipeEntries,
    selectedRecipeKey,
    applyRecipe,
    selectedRecipeLabel,
    machine,
    machineDot,
    graphvizOnEdgeHover,
    tests,
    setTests,
    simulate,
    confirmModal,
  } = logic

  return (
    <div className="hidden md:flex flex-row flex-1 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        <ResizablePanel id="workbench-desktop-left-panel" defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 flex items-center gap-4 px-4 pt-3 pb-2">
              <Tabs
                value={activeTab}
                onValueChange={value => requestTabChange(value as TabId)}
              >
                <TabsList className="gap-4">
                  {visibleTabs.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="capitalize"
                      aria-controls={`tab-panel-${tab.id}`}
                    >
                      {TAB_LABELS[tab.id] ?? tab.id}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <RecipeDropdown
                recipeEntries={recipeEntries}
                selectedRecipeKey={selectedRecipeKey}
                applyRecipe={applyRecipe}
                selectedRecipeLabel={selectedRecipeLabel}
                className="ml-auto"
                size="lg"
              />
            </div>

            <div className="flex-1 overflow-hidden min-h-0">{activeTabContent}</div>

            {confirmModal && <ConfirmModal {...confirmModal} />}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel id="workbench-desktop-right-panel" defaultSize={50} minSize={30}>
          <ResizablePanelGroup orientation="vertical" className="h-full flex-col">
            <ResizablePanel id="workbench-desktop-graph-panel" defaultSize={40} minSize={30}>
              <div className="h-full overflow-y-auto overflow-x-hidden min-w-0">
                <div className="flex flex-col gap-4 p-6 min-w-0">
                  <WorkbenchHeader logic={logic} />
                  {machine && machineDot && (
                    <GraphvizViewer
                      dot={machineDot}
                      machineName={machine.name ?? 'machine'}
                      showExportActions
                      onEdgeHover={graphvizOnEdgeHover}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel id="workbench-desktop-tests-panel" defaultSize={60} minSize={20}>
              <div className="h-full overflow-y-auto overflow-x-hidden min-w-0">
                <div className="p-6">
                  <TestSuite
                    tests={tests}
                    setTests={setTests}
                    evaluateInput={
                      machine ? (input: string) => simulate(machine, input) : undefined
                    }
                    machineName={machine?.name ?? 'delta'}
                    resetKeys={[machine, selectedRecipeKey]}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
