'use client'

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from './button'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: React.ComponentProps<typeof Button>['variant']
  cancelVariant?: React.ComponentProps<typeof Button>['variant']
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog className="relative z-modal" onClose={onCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ctp-crust/60 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto font-sans">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-md transform overflow-hidden bg-ctp-base border border-ctp-subtext0/25 p-6 text-left align-middle rounded-2xl shadow-xl transition-all flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <DialogTitle className="text-lg font-bold text-ctp-text font-mono">
                    {title}
                  </DialogTitle>
                  <p className="text-sm text-ctp-subtext0 leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="flex flex-row justify-end gap-3 mt-4">
                  <Button
                    onClick={onCancel}
                    variant={cancelVariant}
                  >
                    {cancelText}
                  </Button>

                  <Button
                    onClick={onConfirm}
                    variant={confirmVariant}
                  >
                    {confirmText}
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
