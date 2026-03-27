"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { remark } from "remark";
import html from "remark-html";
import { useDeltaStore } from "@/store/deltaStore";
import { APP_VERSION, CHANGELOG } from "../changelog";

function MarkdownBlock({ content }: { content: string }) {
  const [parsedHtml, setParsedHtml] = useState("");

  useEffect(() => {
    remark()
      .use(html)
      .process(content)
      .then((file) => setParsedHtml(String(file)))
      .catch((err) => console.error("Failed to parse markdown", err));
  }, [content]);

  return (
    <article
      className="prose pt-3"
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
}

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const lastSeenVersion = useDeltaStore((s) => s.app.lastSeenVersion);
  const setApp = useDeltaStore((s) => s.actions.setApp);

  const endIndex = CHANGELOG.findIndex(
    (log) => log.version === lastSeenVersion,
  );
  const unseenLogs = lastSeenVersion
    ? CHANGELOG.slice(0, endIndex === -1 ? CHANGELOG.length : endIndex)
    : [];

  useEffect(() => {
    if (lastSeenVersion !== APP_VERSION) {
      setIsOpen(true);
    }
  }, [lastSeenVersion]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setApp({ lastSeenVersion: APP_VERSION });
    }, 2000);
  };

  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ctp-crust/80 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden bg-ctp-base border border-ctp-surface0 p-6 text-left align-middle rounded-2xl shadow-xl transition-all flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center border-b border-ctp-surface0 pb-4 mb-4 shrink-0">
                  <DialogTitle className="text-xl font-bold text-ctp-text">
                    What's New in Delta
                  </DialogTitle>
                  <span className="text-xs font-mono px-2 py-1 bg-ctp-blue/20 text-ctp-blue rounded-md">
                    v{APP_VERSION}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {unseenLogs.map((log) => (
                    <div key={log.version} className="mb-8 last:mb-2">
                      <div className="flex items-baseline gap-3 mb-2">
                        <h3 className="text-lg font-bold text-ctp-text">
                          {log.version}
                        </h3>
                        <span className="text-sm text-ctp-subtext0">
                          {log.date}
                        </span>
                      </div>

                      <MarkdownBlock content={log.notes} />
                    </div>
                  ))}
                </div>

                <div className="mt-6 shrink-0 pt-4 border-t border-ctp-surface0">
                  <button
                    onClick={handleClose}
                    className="text-sm px-4 py-1.5 rounded-lg bg-ctp-mauve/20 border border-ctp-mauve text-ctp-mauve hover:bg-ctp-mauve/30 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ctp-mauve focus-visible:ring-offset-2 focus-visible:ring-offset-ctp-base"
                  >
                    Continue
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
