'use client'

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment } from 'react'

interface AlertProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  onClose: () => void
}

export function Alert({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  onConfirm,
  onClose,
}: AlertProps) {
  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog className="relative z-50" onClose={onClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
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
              <DialogPanel className="relative w-full max-w-md transform overflow-hidden bg-ctp-base border border-ctp-surface0 p-6 text-left align-middle rounded-2xl shadow-xl transition-all flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <DialogTitle className="text-lg font-bold text-ctp-text">
                    {title}
                  </DialogTitle>
                  <p className="text-sm text-ctp-subtext0 leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="flex flex-row justify-end gap-3 mt-4">
                  <button
                    onClick={onConfirm}
                    className="text-sm px-4 py-1.5 rounded-lg bg-ctp-mauve/20 border border-ctp-mauve text-ctp-mauve hover:bg-ctp-mauve/30 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ctp-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-ctp-base"
                  >
                    {confirmText}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
