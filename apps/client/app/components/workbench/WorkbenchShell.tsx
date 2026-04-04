'use client'

import type { TabId, WorkbenchLogic } from './types'
import { Check, CodeXml, Share2, TestTube, Workflow } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import * as React from 'react'
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

const MOBILE_TABS: { id: TabId, label: string, Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'code', label: 'Code', Icon: ({ className }) => (
    <CodeXml className={className} />
  ) },
  { id: 'canvas', label: 'Canvas', Icon: ({ className }) => (
    <Workflow className={className} />
  ) },
  { id: 'debug', label: 'Debug', Icon: ({ className }) => (
    <TestTube className={className} />
  ) },
  { id: 'tests', label: 'Tests', Icon: ({ className }) => (
    <TestTube className={className} />
  ) },
]

const TAB_LABELS: Partial<Record<TabId, string>> = {
  code: 'Code',
  debug: 'Debug',
}

const MOBILE_TAB_IDS = MOBILE_TABS.map(t => t.id)

function getMobileTabIndex(tab: TabId): number {
  const index = MOBILE_TAB_IDS.indexOf(tab)
  return index >= 0 ? index : 0
}

interface UseScrollTabSyncOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  activeIndex: number
  onChangeIndex: (index: number) => void
  tabCount?: number
}

function useScrollTabSync({
  containerRef,
  activeIndex,
  onChangeIndex,
}: UseScrollTabSyncOptions) {
  const scrollSettleTimeoutRef = useRef<number | null>(null)
  const lastAppliedIndexRef = useRef(activeIndex)

  // Sync activeIndex -> scroll position
  useEffect(() => {
    if (!containerRef.current)
      return
    const targetScroll = activeIndex * window.innerWidth
    const current = containerRef.current.scrollLeft
    if (Math.abs(current - targetScroll) > 16) {
      containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' })
    }
    lastAppliedIndexRef.current = activeIndex
  }, [activeIndex, containerRef])

  // Sync scroll position -> activeIndex (debounced)
  const handleScroll = useCallback(() => {
    if (scrollSettleTimeoutRef.current !== null) {
      clearTimeout(scrollSettleTimeoutRef.current)
    }

    scrollSettleTimeoutRef.current = window.setTimeout(() => {
      if (!containerRef.current)
        return
      const newIndex = Math.round(
        containerRef.current.scrollLeft / window.innerWidth,
      )
      if (newIndex !== lastAppliedIndexRef.current) {
        lastAppliedIndexRef.current = newIndex
        onChangeIndex(newIndex)
      }
    }, 150)
  }, [containerRef, onChangeIndex])

  // Handle device rotation/resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current)
        return
      const targetScroll = lastAppliedIndexRef.current * window.innerWidth
      containerRef.current.scrollTo({ left: targetScroll, behavior: 'auto' })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (scrollSettleTimeoutRef.current !== null) {
        clearTimeout(scrollSettleTimeoutRef.current)
      }
    }
  }, [containerRef])

  return { handleScroll }
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
  } = logic
  const mobileActiveIndex = getMobileTabIndex(activeTab)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleIndexChange = useCallback((index: number) => {
    if (index < 0 || index >= MOBILE_TAB_IDS.length) {
      return
    }

    const tabId = MOBILE_TAB_IDS[index]
    if (tabId)
      requestTabChange(tabId)
  }, [requestTabChange])

  const { handleScroll } = useScrollTabSync({
    containerRef: scrollContainerRef,
    activeIndex: mobileActiveIndex,
    onChangeIndex: handleIndexChange,
    tabCount: MOBILE_TABS.length,
  })

  return (
    <div className="flex flex-col md:hidden w-full h-full overflow-hidden">
      {/* Mobile header */}
      <MobileHeader logic={logic} />

      {/* Sliding panel track */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden md:hidden min-h-0"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Track: all panels side-by-side */}
        <div
          className="flex h-full"
          style={{
            width: `${MOBILE_TABS.length * 100}%`,
          }}
        >
          {/* Panel: Code */}
          <div
            className="h-full overflow-hidden shrink-0"
            style={{ width: '100vw', scrollSnapAlign: 'center' }}
          >
            {logic.visibleTabs.find(t => t.id === 'code')?.content}
          </div>

          {/* Panel: Debug / Trace */}
          <div
            className="h-full overflow-hidden shrink-0 p-4"
            style={{ width: '100vw', scrollSnapAlign: 'center' }}
          >
            {/* When debug tab is active, show the debug content.
                We always render it so the TraceProvider context stays alive,
                but only the active panel is "in view". */}
            {logic.visibleTabs.find(t => t.id === 'debug')?.content}
          </div>

          {/* Panel: Tests */}
          <div
            className="h-full overflow-y-auto shrink-0"
            style={{ width: '100vw', scrollSnapAlign: 'center' }}
          >
            <div className="p-4">
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
        </div>
      </div>

      {/* iOS-style bottom tab bar */}
      <nav
        className="shrink-0 flex items-stretch border-t border-ctp-surface0 bg-ctp-base/90 backdrop-blur-md"
        role="tablist"
      >
        {MOBILE_TABS.map((tab, index) => {
          const isActive = index === mobileActiveIndex
          return (
            <Button
              key={tab.id}
              onClick={() => handleIndexChange(index)}
              variant="ghost"
              className={`h-auto flex-1 flex-col items-center justify-center gap-0.5 py-2 ${
                isActive ? 'text-ctp-mauve' : 'text-ctp-overlay1'
              }`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
            >
              <tab.Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">
                {tab.label}
              </span>
            </Button>
          )
        })}
      </nav>

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
    <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-ctp-base/75 backdrop-blur-md">
      {/* Left side: Machine name + Share button */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <h1 className="text-ctp-text text-xs font-bold uppercase tracking-widest truncate min-w-0">
          {machine?.name ?? 'untitled'}
        </h1>
        <Button
          onClick={handleShare}
          variant="embossed"
          size="icon-sm"
          className="text-ctp-overlay0 hover:text-ctp-text"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Right side: Compile status, button, and recipe dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Compile status pill */}
        <span
          className={`text-xs font-bold shrink-0 ${
            editorErrors && editorErrors.length > 0 ? 'text-ctp-red' : 'text-ctp-green'
          }`}
        >
          {editorErrors && editorErrors.length > 0 ? '✗' : '✓'}
        </span>

        {/* Compile button */}
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

        {/* Recipe dropdown */}
        {recipeEntries.length > 0 && (
          <RecipeDropdown
            recipeEntries={recipeEntries}
            selectedRecipeKey={selectedRecipeKey}
            applyRecipe={applyRecipe}
            selectedRecipeLabel={selectedRecipeLabel}
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
            {/* Fixed header: tabs + recipe dropdown */}
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
              />
            </div>

            {/* Editor fills remaining height */}
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
}: {
  recipeEntries: [string, { label: string }][]
  selectedRecipeKey: string
  applyRecipe: (key: string) => void
  selectedRecipeLabel: string
  className?: string
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
          size="lg"
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
