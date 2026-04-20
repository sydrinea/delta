import { beforeEach, describe, expect, it } from 'vitest'
import { useWorkbenchStore } from '../app/store/workbench-store'

beforeEach(() => {
  useWorkbenchStore.setState({ activeTab: 'code', selectedRecipeKey: '', confirmModal: null })
})

describe('useWorkbenchStore', () => {
  describe('initial state', () => {
    it('starts with activeTab "code"', () => {
      expect(useWorkbenchStore.getState().activeTab).toBe('code')
    })

    it('starts with empty selectedRecipeKey', () => {
      expect(useWorkbenchStore.getState().selectedRecipeKey).toBe('')
    })

    it('starts with null confirmModal', () => {
      expect(useWorkbenchStore.getState().confirmModal).toBeNull()
    })
  })

  describe('setActiveTab', () => {
    it('updates activeTab to canvas', () => {
      useWorkbenchStore.getState().setActiveTab('canvas')
      expect(useWorkbenchStore.getState().activeTab).toBe('canvas')
    })

    it('updates activeTab to debug', () => {
      useWorkbenchStore.getState().setActiveTab('debug')
      expect(useWorkbenchStore.getState().activeTab).toBe('debug')
    })

    it('can switch back to code', () => {
      useWorkbenchStore.getState().setActiveTab('canvas')
      useWorkbenchStore.getState().setActiveTab('code')
      expect(useWorkbenchStore.getState().activeTab).toBe('code')
    })
  })

  describe('setSelectedRecipeKey', () => {
    it('updates selectedRecipeKey', () => {
      useWorkbenchStore.getState().setSelectedRecipeKey('endsInAb')
      expect(useWorkbenchStore.getState().selectedRecipeKey).toBe('endsInAb')
    })

    it('can clear selectedRecipeKey', () => {
      useWorkbenchStore.getState().setSelectedRecipeKey('endsInAb')
      useWorkbenchStore.getState().setSelectedRecipeKey('')
      expect(useWorkbenchStore.getState().selectedRecipeKey).toBe('')
    })
  })

  describe('setConfirmModal', () => {
    it('sets a modal config', () => {
      const modal = { title: 'Confirm?', onConfirm: () => {} }
      useWorkbenchStore.getState().setConfirmModal(modal as any)
      expect(useWorkbenchStore.getState().confirmModal).toEqual(modal)
    })

    it('clears modal by setting null', () => {
      useWorkbenchStore.getState().setConfirmModal({ title: 'X', onConfirm: () => {} } as any)
      useWorkbenchStore.getState().setConfirmModal(null)
      expect(useWorkbenchStore.getState().confirmModal).toBeNull()
    })
  })
})
