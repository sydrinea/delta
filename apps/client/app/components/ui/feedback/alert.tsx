'use client'

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '../primitives/button'

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
      <Dialog className="relative z-modal" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity" />
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
              <DialogPanel className="relative w-full max-w-md transform overflow-hidden bg-background border border-muted-foreground/25 p-6 text-left align-middle rounded-2xl shadow-xl transition-all flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="flex flex-row justify-end gap-3 mt-4">
                  <Button
                    onClick={onConfirm}
                    variant="primary"
                    size="sm"
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
