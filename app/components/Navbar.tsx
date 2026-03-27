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
  { label: "NFA / DFA", href: "/" },
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
      <header className="flex items-center justify-between px-6 py-3 border-b border-ctp-surface0 shrink-0 relative z-50">
        {/* mobile — animated hamburger → x */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-ctp-text w-5 h-5 relative cursor-pointer"
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

        {/* desktop — delta + tabs */}
        <div className="hidden md:flex items-center gap-6">
          <h1 className="text-ctp-text text-sm font-bold tracking-widest uppercase">
            delta
          </h1>

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

        {/* mobile — delta title centered */}
        <h1 className="md:hidden text-ctp-text text-sm font-bold tracking-widest uppercase absolute left-1/2 -translate-x-1/2">
          delta
        </h1>

        <div className="hidden md:flex items-center gap-1.5">
          <MadeBy />
          <span className="text-ctp-overlay1 text-xs">·</span>
          <span className="text-ctp-overlay0 text-xs font-mono">
            v{version}
          </span>
        </div>
      </header>

      {/* mobile overlay */}
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
              className="text-ctp-overlay0 font-mono text-sm"
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
