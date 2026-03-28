"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  shouldAnimateLoader,
  shouldTriggerNavigationLoader,
} from "@/lib/navigation-loader-config";
import { GitHub } from "@/icons/GitHub";

interface FeatureBlock {
  title: string;
  description: string;
  bg: string;
  labelColor: string;
  bgHover: string;
  border: string;
  shadow: string;
  href: string;
  label: string;
  external?: boolean;
}

const blocks: FeatureBlock[] = [
  {
    title: "NFA / DFA",
    description:
      "Build nondeterministic and deterministic finite automata with a fluent API. Step through execution, run test suites, and edit machines visually on the canvas.",
    bg: "bg-ctp-mauve/10",
    bgHover: "hover:bg-ctp-mauve/20",
    border: "border-ctp-mauve/25",
    shadow: "shadow-ctp-mauve/10",
    labelColor: "text-ctp-mauve",
    href: "/nfa",
    label: "open →",
  },
  {
    title: "Turing Machines",
    description:
      "Single and multitape Turing machines with full step-through visualization. The transition table highlights the active rule at every step.",
    bg: "bg-ctp-blue/10",
    bgHover: "hover:bg-ctp-blue/20",
    border: "border-ctp-blue/25",
    shadow: "shadow-ctp-blue/10",
    labelColor: "text-ctp-blue",
    href: "/tm",
    label: "open →",
  },
  {
    title: "Quick Start",
    description:
      "Builder lifecycle, shared methods, the q() helper, and everything you need to write your first machine in under five minutes.",
    bg: "bg-ctp-green/10",
    bgHover: "hover:bg-ctp-green/20",
    border: "border-ctp-green/25",
    shadow: "shadow-ctp-green/10",
    labelColor: "text-ctp-green",
    href: "https://github.com/sydrinea/delta/blob/main/docs/quick-start.md",
    label: "read →",
    external: true,
  },
  {
    title: "Demo",
    description:
      "A five-minute walkthrough of the main features — writing machines, stepping through execution, and building on the canvas.",
    bg: "bg-ctp-peach/10",
    bgHover: "hover:bg-ctp-peach/20",
    border: "border-ctp-peach/25",
    shadow: "shadow-ctp-peach/10",
    labelColor: "text-ctp-peach",
    href: "https://www.youtube.com/watch?v=zOM9aVSUVi0",
    label: "watch →",
    external: true,
  },
];

export default function Home() {
  const pathname = usePathname();

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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto w-full">
      <div className="mb-12 text-center">
        <p className="text-ctp-overlay0 text-xs tracking-widest uppercase mb-4">
          delta
        </p>
        <h1 className="text-ctp-text text-3xl font-bold mb-4 leading-tight">
          design, test, and visualize automata
        </h1>
        <p className="text-ctp-subtext0 text-sm max-w-md mx-auto leading-relaxed font-sans">
          A code-first environment for finite automata and Turing machines.
          Write machines as TypeScript, run test suites, and step through
          execution visually.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-10">
        {blocks.map((block) => (
          <Link
            key={block.title}
            href={block.href}
            onClick={() => block.external || handleNavigationStart(block.href)}
            className={`
              group relative rounded-xl border p-5
              transition-all duration-300 overflow-hidden
              shadow-lg
              ${block.bg} ${block.bgHover} ${block.border} ${block.shadow} ${block.labelColor}
            `}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-sm font-semibold font-mono">
                  {block.title}
                </h2>
                <span
                  className={`${block.labelColor} text-xs font-mono transition-colors duration-200`}
                >
                  {block.label}
                </span>
              </div>
              <p className="font-sans text-ctp-subtext1 text-xs leading-relaxed">
                {block.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/sydrinea/delta"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-ctp-overlay0 hover:text-ctp-text hover:bg-ctp-surface0 border border-transparent hover:border-ctp-surface1 transition-all duration-200"
          aria-label="View on GitHub"
        >
          <GitHub className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
