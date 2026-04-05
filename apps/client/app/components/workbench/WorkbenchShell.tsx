'use client'

import type { TabId, WorkbenchLogic } from './types'
import { Check, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmModal, TestSuite } from '../ui'
import { Button } from '../ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { WithTooltip } from '../ui/tooltip'
import { GraphvizViewer } from '../visualize'

const TAB_LABELS: Partial<Record<TabId, string>> = {
  code: 'Code',
  debug: 'Debug',
  canvas: 'Canvas',
}

interface WorkbenchShellProps<M extends { name?: string }> {
  logic: WorkbenchLogic<M>
}

export function WorkbenchShell<M extends { name?: string }>({
  logic,
}: WorkbenchShellProps<M>) {
  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
      <DesktopWorkbench logic={logic} />
      <MobileWorkbench logic={logic} />
    </div>
  )
}

function MobileWorkbench<M extends { name?: string }>({
  logic,
}: WorkbenchShellProps<M>) {
  const {
    machine,
    tests,
    setTests,
    simulate,
    selectedRecipeKey,
    requestTabChange,
    activeTab,
    confirmModal,
    visibleTabs,
  } = logic

  const mobileVisibleTabs = visibleTabs.filter(t => t.id !== 'canvas' && t.id !== 'code')

  const [mobileTab, setMobileTab] = useState<string>(() => {
    return activeTab === 'code' || activeTab === 'canvas' ? 'debug' : activeTab
  })

  useEffect(() => {
    (async () => {
      if (activeTab !== 'code' && activeTab !== 'canvas') {
        setMobileTab(activeTab)
      }
    })()
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setMobileTab(value)
    if (value !== 'tests') {
      requestTabChange(value as TabId)
    }
  }

  return (
    <div className="flex flex-col md:hidden w-full h-full overflow-hidden">
      <MobileHeader logic={logic} />

      <Tabs
        value={mobileTab}
        onValueChange={handleTabChange}
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

          {/* Dedicated Tests Panel */}
          <div
            className={`absolute inset-0 w-full h-full overflow-y-auto p-4 transition-opacity duration-200 ${
              mobileTab === 'tests'
                ? 'opacity-100 pointer-events-auto z-10'
                : 'opacity-0 pointer-events-none z-0'
            }`}
          >
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
      </Tabs>

      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  )
}

function MobileHeader<M extends { name?: string }>({
  logic,
}: WorkbenchShellProps<M>) {
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

function DesktopWorkbench<M extends { name?: string }>({
  logic,
}: WorkbenchShellProps<M>) {
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
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full"
      >
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
                size="lg" // Retain original size on desktop
              />
            </div>

            <div className="flex-1 overflow-hidden min-h-0">{activeTabContent}</div>

            {confirmModal && <ConfirmModal {...confirmModal} />}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel id="workbench-desktop-right-panel" defaultSize={50} minSize={30}>
          <ResizablePanelGroup
            orientation="vertical"
            className="h-full flex-col"
          >
            <ResizablePanel id="workbench-desktop-graph-panel" defaultSize={40} minSize={30}>
              <div className="h-full overflow-y-auto overflow-x-hidden min-w-0">
                <div className="flex flex-col gap-4 p-6 min-w-0">
                  <WorkbenchHeader logic={logic} />
                  {machine && machineDot
                    && (
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

function WorkbenchHeader<M extends { name?: string }>({
  logic,
}: WorkbenchShellProps<M>) {
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
                ? (
                    <Check className="w-4 h-4" />
                  )
                : (
                    <Share2 className="w-4 h-4" />
                  )}
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

export function RecipeDropdown({
  recipeEntries,
  selectedRecipeKey,
  applyRecipe,
  selectedRecipeLabel,
  className = '',
  size = 'lg',
}: {
  recipeEntries: [string, { label: string }][]
  selectedRecipeKey: string
  applyRecipe: (key: string) => void
  selectedRecipeLabel: string
  className?: string
  size: 'default' | 'sm' | 'lg'
}) {
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
