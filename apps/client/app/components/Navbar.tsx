"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  shouldAnimateLoader,
  shouldTriggerNavigationLoader,
} from "@/lib/navigation-loader-config";
import { Heart } from "./icons/Heart";
import { version } from "../../package.json";

const TABS = [
  { label: "NFA / DFA", href: "/nfa" },
  { label: "PDA", href: "/pda" },
  { label: "TM", href: "/tm" },
] as const;

const MadeBy = () => (
  <a
    href="https://github.com/sydrinea"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1.5 text-ctp-overlay1 hover:text-ctp-text transition-colors text-xs"
  >
    made with <Heart /> by @sydrinea
  </a>
);

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleNavigationStart = (href: string) => {
    if (pathname === href) return;
    if (!shouldTriggerNavigationLoader(href)) return;

    window.dispatchEvent(
      new CustomEvent("delta:navigation-start", {
        detail: {
          to: href,
          animate: shouldAnimateLoader(href),
        },
      }),
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-14 w-full shrink-0 border-b border-ctp-surface0 bg-ctp-base/75 backdrop-blur-md">
        <div className="hidden md:flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <h1 className="text-ctp-text text-sm font-bold tracking-widest uppercase">
                delta
              </h1>
            </Link>

            <nav className="flex items-center gap-1">
              {TABS.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => handleNavigationStart(tab.href)}
                    className={`relative px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-ctp-text"
                        : "text-ctp-subtext0 hover:text-ctp-text"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-ctp-surface0 rounded-lg animate-in fade-in slide-in-from-bottom-1 duration-200" />
                    )}
                    <span className="relative">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <MadeBy />
            <span className="text-ctp-overlay1 text-xs">·</span>
            <span className="text-ctp-overlay0 text-xs">v{version}</span>
          </div>
        </div>

        <div className="grid h-full grid-cols-3 items-center px-6 md:hidden">
          <div className="flex justify-start">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-ctp-text w-5 h-5 relative cursor-pointer"
              aria-label={open ? "close menu" : "open menu"}
            >
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-300 ${
                  open ? "top-2 rotate-45" : "top-0.5"
                }`}
              />
              <span
                className={`absolute left-0 top-2 h-0.5 w-5 bg-current transition-all duration-300 ${
                  open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-300 ${
                  open ? "top-2 -rotate-45" : "top-3.5"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-center">
            <Link href="/">
              <h1 className="text-ctp-text text-sm font-bold tracking-widest uppercase">
                delta
              </h1>
            </Link>
          </div>

          <div className="flex justify-end"></div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-75 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* glassy blur backdrop */}
        <div
          className="absolute inset-0 bg-ctp-base/70 backdrop-blur-md"
          onClick={() => setOpen(false)}
        />

        {/* menu panel */}
        <div
          className={`absolute inset-x-0 top-0 flex flex-col p-8 transition-all duration-300 ${
            open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <nav className="flex flex-col gap-2 mt-10">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => {
                    handleNavigationStart(tab.href);
                    setOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-ctp-surface0/80 text-ctp-text"
                      : "text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0/60"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-12 flex flex-col gap-1">
            <MadeBy />
            <span
              className="text-ctp-overlay0 text-sm"
              style={{ fontSize: "0.65rem" }}
            >
              v{version}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
