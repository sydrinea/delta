'use client'

import type { WorkbenchLogic } from './types'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { Check, Share2 } from 'lucide-react'
import { Fragment } from 'react'
import { ConfirmModal } from '@/components/ConfirmModal'
import { TestSuite } from '@/components/TestSuite'
import { Tooltip } from '@/components/Tooltip'
import { GraphvizViewer } from '@/components/visualize/GraphvizViewer'

interface WorkbenchScaffoldProps<M extends { name?: string }> {
  logic: WorkbenchLogic<M>
}

export function WorkbenchScaffold<M extends { name?: string }>({
  logic,
}: WorkbenchScaffoldProps<M>) {
  return (
    <>
      <DesktopWorkbench logic={logic} />
      <MobileWorkbench logic={logic} />
    </>
  )
}

function MobileWorkbench<M extends { name?: string }>({
  logic,
}: WorkbenchScaffoldProps<M>) {
  const { machine, tests, setTests, simulate } = logic

  return (
    <div className="flex flex-col md:hidden w-full h-full overflow-y-auto min-w-0 p-4 gap-6">
      <WorkbenchHeader logic={logic} />

      <div className="flex-1 w-full min-h-75">
        {machine && <div className="h-full">{logic.activeTabContent}</div>}
      </div>

      <TestSuite
        tests={tests}
        setTests={setTests}
        evaluateInput={
          machine ? (input: string) => simulate(machine, input) : undefined
        }
        machineName={machine?.name ?? 'delta'}
        resetKeys={[machine, logic.selectedRecipeKey]}
      />
    </div>
  )
}

function DesktopWorkbench<M extends { name?: string }>({
  logic,
}: WorkbenchScaffoldProps<M>) {
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
      <div className="flex flex-col border-r border-ctp-surface0 w-1/2 overflow-hidden">
        <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-ctp-surface0 shrink-0 relative z-50">
          <div className="flex items-center gap-4 shrink-0">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => requestTabChange(tab.id)}
                className={`tracking-wide pb-2 text-xs transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-ctp-text border-ctp-mauve'
                    : 'text-ctp-subtext0 border-transparent hover:text-ctp-text'
                }`}
              >
                {tab.id}
              </button>
            ))}
          </div>

          <RecipeDropdown
            recipeEntries={recipeEntries}
            selectedRecipeKey={selectedRecipeKey}
            applyRecipe={applyRecipe}
            selectedRecipeLabel={selectedRecipeLabel}
            className="ml-auto pb-2 shrink"
          />
        </div>

        <div className="flex-1 overflow-hidden">{activeTabContent}</div>

        {confirmModal && <ConfirmModal {...confirmModal} />}
      </div>

      <div className="flex flex-col w-1/2 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="flex flex-col gap-4 p-6 min-w-0">
          <WorkbenchHeader logic={logic} />

          <div className="flex flex-col gap-4">
            {machine && machineDot && (
              <GraphvizViewer
                dot={machineDot}
                machineName={machine.name ?? 'machine'}
                showExportActions
                onEdgeHover={graphvizOnEdgeHover}
              />
            )}

            <TestSuite
              tests={tests}
              setTests={setTests}
              evaluateInput={
                machine
                  ? (input: string) => simulate(machine, input)
                  : undefined
              }
              machineName={machine?.name ?? 'delta'}
              resetKeys={[machine, selectedRecipeKey]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkbenchHeader<M extends { name?: string }>({
  logic,
}: WorkbenchScaffoldProps<M>) {
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
        <Tooltip label="cmd+s">
          <button
            onClick={() => compile(editorValue)}
            className="hover:cursor-pointer text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            compile
          </button>
        </Tooltip>
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
          <Tooltip label="Share Machine">
            <button
              onClick={handleShare}
              className="text-ctp-overlay0 hover:text-ctp-text transition-colors flex items-center shrink-0"
            >
              {copied
                ? (
                    <Check className="w-4 h-4" />
                  )
                : (
                    <Share2 className="w-4 h-4" />
                  )}
            </button>
          </Tooltip>
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

function RecipeDropdown({
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
    <Listbox
      as="div"
      value={selectedRecipeKey}
      onChange={applyRecipe}
      className={`min-w-0 ${className}`}
    >
      <div className="relative w-full md:w-auto min-w-32">
        <ListboxButton className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg pl-3 pr-8 py-1 text-xs text-left text-ctp-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-ctp-mauve overflow-hidden">
          <span
            className={`block overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              selectedRecipeKey ? '' : 'text-ctp-subtext1'
            }`}
          >
            {selectedRecipeLabel}
          </span>
        </ListboxButton>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ctp-overlay0 pointer-events-none bg-ctp-mantle"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 4L6 8L10 4" />
        </svg>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <ListboxOptions className="absolute right-0 z-30 mt-1 max-h-60 min-w-56 overflow-auto rounded-lg border border-ctp-surface1 bg-ctp-mantle py-1 text-sm shadow-lg focus:outline-none">
            {recipeEntries.map(([key, recipe]) => (
              <ListboxOption
                key={key}
                value={key}
                className="cursor-pointer select-none px-3 py-1.5 text-xs text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
              >
                {recipe.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}
