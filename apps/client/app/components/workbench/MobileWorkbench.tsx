'use client'

import type { TabId, WorkbenchLogic, WorkbenchMachine } from './types'
import { useEffect, useState } from 'react'
import { ConfirmModal, TestSuite } from '../ui'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { MobileHeader } from './MobileHeader'

const TAB_LABELS: Partial<Record<TabId, string>> = {
  code: 'Code',
  debug: 'Debug',
  canvas: 'Canvas',
}

interface MobileWorkbenchProps<M extends WorkbenchMachine> {
  logic: WorkbenchLogic<M>
}

export function MobileWorkbench<M extends WorkbenchMachine>({ logic }: MobileWorkbenchProps<M>) {
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
