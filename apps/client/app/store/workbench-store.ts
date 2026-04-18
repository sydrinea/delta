import { create } from 'zustand'
import type { TabId, ConfirmModalConfig } from '../components/workbench/types'

interface WorkbenchState {
  activeTab: TabId
  selectedRecipeKey: string
  confirmModal: ConfirmModalConfig | null
  setActiveTab: (tab: TabId) => void
  setSelectedRecipeKey: (key: string) => void
  setConfirmModal: (modal: ConfirmModalConfig | null) => void
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  activeTab: 'code',
  selectedRecipeKey: '',
  confirmModal: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedRecipeKey: (key) => set({ selectedRecipeKey: key }),
  setConfirmModal: (modal) => set({ confirmModal: modal }),
}))
