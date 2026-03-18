"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "NFA / DFA", href: "/" },
  { label: "PDA", href: "/pda" },
  { label: "TM", href: "/tm" },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-ctp-surface0 shrink-0">
      <div className="flex items-center gap-6">
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
    </header>
  );
}
