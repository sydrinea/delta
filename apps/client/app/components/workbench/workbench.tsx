'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import type { MachineType } from '@/lib/worker/protocol'
import { useCompiledMachine } from '@/hooks/use-compiled-machine'
import { useEditorState } from '@/hooks/use-editor-state'
import { useUrlSync } from '@/hooks/use-url-sync'
import { useCompile } from '@/hooks/use-compile'
import { useAutomataStore } from '@/store/automata-store'
import { toDot } from '@/lib/dot'
import { themeNames } from '@/lib/theme'
import { DeltaEditor } from '../editor'
import { Trace, GraphvizViewer } from '../visualize'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { TestSuite, ConfirmModal } from '../ui'
import { WorkbenchHeader } from './workbench-header'
import { MobileHeader } from './mobile-header'
import { RecipeDropdown } from './recipe-dropdown'
import { useWorkbenchStore } from '@/store/workbench-store'
import { useSimulatorStore } from '@/store/simulator-store'
import { WORKBENCH_CONFIGS } from './workbench-configs'
import type { TabId } from './types'

const TAB_LABELS: Partial<Record<TabId, string>> = {
  code: 'Code',
  debug: 'Debug',
  canvas: 'Canvas',
}

export function Workbench({ 
  scope,
  initialTab,
  initialRecipe,
  initialInput
}: { 
  scope: MachineType
  initialTab?: TabId
  initialRecipe?: string
  initialInput?: string
}) {
  return (
    <WorkbenchLayout scope={scope} initialTab={initialTab} initialRecipe={initialRecipe} />
  )
}



function WorkbenchLayout({ 
  scope,
  initialTab,
  initialRecipe
}: { 
  scope: MachineType
  initialTab?: TabId
  initialRecipe?: string
}) {
  const config = WORKBENCH_CONFIGS[scope]
  const machine = useCompiledMachine(scope) as any
  
  
  const trace = useSimulatorStore(s => s.trace)
  const step = useSimulatorStore(s => s.step)
  const setHoveredEdgeId = useSimulatorStore(s => s.setHoveredEdgeId)
  
  const { resolvedTheme } = useTheme()
  const theme = themeNames[resolvedTheme ?? 'light']
  const machineDot = useMemo(() => {
    if (!machine) return null
    const current = trace[step]
    if (current) {
      return toDot(machine, config.dotConfig as any, theme, current.states)
    }
    return toDot(machine, config.dotConfig as any, theme)
  }, [machine, trace, step, config.dotConfig, theme])
  
  const activeTab = useWorkbenchStore(s => s.activeTab)
  const setActiveTab = useWorkbenchStore(s => s.setActiveTab)
  const selectedRecipeKey = useWorkbenchStore(s => s.selectedRecipeKey)
  const setSelectedRecipeKey = useWorkbenchStore(s => s.setSelectedRecipeKey)
  const confirmModal = useWorkbenchStore(s => s.confirmModal)
  const setConfirmModal = useWorkbenchStore(s => s.setConfirmModal)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
    if (initialRecipe) setSelectedRecipeKey(initialRecipe)
  }, [initialTab, initialRecipe, setActiveTab, setSelectedRecipeKey])

  const compile = useCompile(scope)
  
  useEffect(() => {
    if (useAutomataStore.persist.hasHydrated()) {
      compile(useAutomataStore.getState().automata[scope].editorValue)
      return
    }
    const unsub = useAutomataStore.persist.onFinishHydration(() => {
      compile(useAutomataStore.getState().automata[scope].editorValue)
      unsub()
    })
    return unsub
  }, [compile, scope])

  useUrlSync({
    machineType: scope,
    activeTab,
    selectedRecipeKey,
  })

  const visibleTabs = useMemo(() => {
    const defaultCanvasContent = (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Canvas is only available for NFA machines.
      </div>
    )
    
    const tabs = [
      { id: 'code' as TabId, content: <DeltaEditor scope={scope} /> },
      { id: 'canvas' as TabId, content: config.canvasContent ?? defaultCanvasContent },
      { id: 'debug' as TabId, content: <Trace scope={scope} /> }
    ]
    
    if (!config.hasCanvas) {
      return tabs.filter(t => t.id !== 'canvas')
    }
    return tabs
  }, [scope, config])

  const activeTabContent = visibleTabs.find(t => t.id === activeTab)?.content ?? visibleTabs[0].content

  const requestTabChange = (tab: TabId) => {
    if (config.tabGuard) {
      const currentEditorValue = useAutomataStore.getState().automata[scope].editorValue
      const guard = config.tabGuard(tab, { machine, editorValue: currentEditorValue })
      if (guard) {
        const { onConfirm: sideEffect, ...modalProps } = guard
        setConfirmModal({
          ...modalProps,
          isOpen: true,
          onConfirm: () => {
            sideEffect?.()
            setActiveTab(tab)
            setConfirmModal(null)
          },
          onCancel: () => setConfirmModal(null),
        })
        return
      }
    }
    setActiveTab(tab)
  }

  const mobileVisibleTabs = visibleTabs.filter(t => t.id !== 'canvas' && t.id !== 'code')
  const [mobileTab, setMobileTab] = useState<string>(() => {
    return activeTab === 'code' || activeTab === 'canvas' ? 'debug' : activeTab
  })
  
  useEffect(() => {
    if (activeTab !== 'code' && activeTab !== 'canvas') {
      setMobileTab(activeTab)
    }
  }, [activeTab])
  
  const handleMobileTabChange = (value: string) => {
    setMobileTab(value)
    if (value !== 'tests') {
      requestTabChange(value as TabId)
    }
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
      <div className="hidden md:flex flex-row flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel id={`workbench-desktop-left-panel-${scope}`} defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="shrink-0 flex items-center gap-4 px-4 pt-3 pb-2">
                <Tabs value={activeTab} onValueChange={value => requestTabChange(value as TabId)}>
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
                <RecipeDropdown scope={scope} className="ml-auto" size="lg" />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">{activeTabContent}</div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel id={`workbench-desktop-right-panel-${scope}`} defaultSize={50} minSize={30}>
            <ResizablePanelGroup orientation="vertical" className="h-full flex-col">
              <ResizablePanel id={`workbench-desktop-graph-panel-${scope}`} defaultSize={40} minSize={30}>
                <div className="h-full overflow-y-auto overflow-x-hidden min-w-0">
                  <div className="flex flex-col gap-4 p-6 min-w-0">
                    <WorkbenchHeader scope={scope} />
                    {machine && machineDot && (
                      <GraphvizViewer
                        dot={machineDot}
                        machineName={machine.name ?? 'machine'}
                        showExportActions
                        onEdgeHover={setHoveredEdgeId}
                      />
                    )}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel id={`workbench-desktop-tests-panel-${scope}`} defaultSize={60} minSize={20}>
                <div className="h-full overflow-y-auto overflow-x-hidden min-w-0">
                  <div className="p-6">
                    <TestSuite scope={scope} />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex flex-col md:hidden w-full h-full overflow-hidden">
        <MobileHeader scope={scope} />
        <Tabs
          value={mobileTab}
          onValueChange={handleMobileTabChange}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="shrink-0 px-4 pt-3 pb-2">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-4">
              {mobileVisibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="capitalize shrink-0"
                  aria-controls={`tab-panel-${tab.id}`}
                >
                  {TAB_LABELS[tab.id] ?? tab.id}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="tests"
                className="capitalize shrink-0"
                aria-controls="tab-panel-tests"
              >
                Tests
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {mobileVisibleTabs.map(tab => (
              <div
                key={tab.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
                  mobileTab === tab.id
                    ? 'opacity-100 pointer-events-auto z-10'
                    : 'opacity-0 pointer-events-none z-0'
                } ${tab.id === 'debug' ? 'p-4' : ''}`}
              >
                {tab.content}
              </div>
            ))}

            <div
              className={`absolute inset-0 w-full h-full overflow-y-auto p-4 transition-opacity duration-200 ${
                mobileTab === 'tests'
                  ? 'opacity-100 pointer-events-auto z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <TestSuite scope={scope} />
            </div>
          </div>
        </Tabs>
      </div>

      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  )
}
