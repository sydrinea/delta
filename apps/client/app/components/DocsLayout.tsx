"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { type Heading, NAV } from "../guide/nav";
import { GitHub } from "@/icons/GitHub";

interface ToCProps {
  headings: Heading[];
  activeId: string;
  onNavigate: (id: string) => void;
}

function TableOfContents({ headings, activeId, onNavigate }: ToCProps) {
  if (!headings.length) return null;

  return (
    <nav className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ctp-overlay0 mb-2 px-1">
        On this page
      </p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          onClick={() => onNavigate(h.id)}
          className={[
            "block text-[13px] leading-snug py-0.5 rounded transition-colors duration-150",
            h.level === 1
              ? "pl-1 font-medium"
              : h.level === 2
                ? "pl-3"
                : "pl-5 text-[12px]",
            activeId === h.id
              ? "text-ctp-mauve font-semibold"
              : "text-ctp-subtext0 hover:text-ctp-text",
          ].join(" ")}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}

interface SidebarContentProps {
  activePage: string;
  onNavigate: (id: string) => void;
}

function SidebarContent({ activePage, onNavigate }: SidebarContentProps) {
  return (
    <div className="py-6 px-4 space-y-6">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ctp-overlay0 mb-1.5 px-1">
            {group.section}
          </p>
          <ul className="space-y-0.5">
            {group.pages.map((page) => {
              const isActive = activePage === page.id;
              return (
                <li key={page.id}>
                  <Link
                    href={`/guide/${page.id === "quick-start" ? "" : page.id}`}
                    onClick={() => onNavigate("")}
                    className={[
                      "block w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer",
                      isActive
                        ? "bg-ctp-surface0 text-ctp-text font-semibold"
                        : "text-ctp-subtext0 hover:bg-ctp-surface0/60 hover:text-ctp-text",
                    ].join(" ")}
                  >
                    {page.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface DocsLayoutProps {
  activePage: string;
  html: string;
  headings: Heading[];
  editUrl: string;
  issueUrl: string;
  previousPage: { label: string; href: string } | null;
  nextPage: { label: string; href: string } | null;
}

export default function DocsLayout({
  activePage,
  html,
  headings,
  editUrl,
  issueUrl,
  previousPage,
  nextPage,
}: DocsLayoutProps) {
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    setActiveHeading(headings[0]?.id ?? "");

    const handleHeadingClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const heading = target.closest("h1, h2, h3") as HTMLElement | null;
      if (!heading?.id) return;

      setActiveHeading(heading.id);

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      heading.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      window.history.replaceState(
        null,
        "",
        `#${encodeURIComponent(heading.id)}`,
      );
    };

    root.addEventListener("click", handleHeadingClick);
    return () => root.removeEventListener("click", handleHeadingClick);
  }, [html, headings]);

  const navigate = useCallback((id: string) => {
    setActiveHeading(id);
    setSidebarOpen(false);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-ctp-base">
        <div className="sticky top-14 z-10 border-b border-ctp-surface0 bg-ctp-base/75 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-ctp-subtext0 hover:bg-ctp-surface0/40 hover:text-ctp-text transition-colors cursor-pointer"
          >
            <span className="font-mono text-ctp-mauve font-bold">
              {sidebarOpen ? "v" : ">"}
            </span>{" "}
            Menu
          </button>
        </div>

        <aside
          className={[
            "fixed inset-0 top-[calc(3.5rem+45px)] z-10 bg-ctp-base overflow-y-auto lg:hidden",
            sidebarOpen ? "block" : "hidden",
          ].join(" ")}
        >
          <div className="py-2 pb-24">
            <SidebarContent activePage={activePage} onNavigate={navigate} />
          </div>
        </aside>

        <div className="mx-auto flex max-w-6xl items-start">
          <aside className="hidden lg:block w-56 shrink-0 self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-ctp-surface0 bg-ctp-base/75 backdrop-blur-md">
            <SidebarContent activePage={activePage} onNavigate={navigate} />
          </aside>

          <main className="flex-1 min-w-0 px-6 py-10 lg:px-12">
            <div ref={contentRef} className="mx-auto max-w-2xl">
              <article
                className="prose doc-prose"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              <footer className="mt-12 border-t border-ctp-surface0 pt-6 pb-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-lg bg-ctp-peach/35 border border-ctp-peach/55 text-ctp-text hover:bg-ctp-peach/45 transition-colors"
                  >
                    <GitHub className="w-3.5 h-3.5" />
                    Edit on GitHub
                  </a>
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-lg bg-ctp-red/35 border border-ctp-red/55 text-ctp-text hover:bg-ctp-red/45 transition-colors"
                  >
                    <GitHub className="w-3.5 h-3.5" />
                    Report issue
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {previousPage ? (
                    <Link
                      href={previousPage.href}
                      onClick={() => navigate("")}
                      className="rounded-lg border border-ctp-surface1 bg-ctp-mantle/70 px-3 py-2 text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors"
                    >
                      <span className="block text-[10px] uppercase tracking-widest text-ctp-overlay0">
                        Previous
                      </span>
                      <span className="block mt-0.5 font-semibold">
                        {previousPage.label}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextPage ? (
                    <Link
                      href={nextPage.href}
                      onClick={() => navigate("")}
                      className="rounded-lg border border-ctp-surface1 bg-ctp-mantle/70 px-3 py-2 text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors sm:text-right"
                    >
                      <span className="block text-[10px] uppercase tracking-widest text-ctp-overlay0">
                        Next
                      </span>
                      <span className="block mt-0.5 font-semibold">
                        {nextPage.label}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </footer>
            </div>
          </main>

          <aside className="hidden xl:block w-52 shrink-0 self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10 px-4 bg-ctp-base/75 backdrop-blur-md">
            <TableOfContents
              headings={headings.slice(1)}
              activeId={activeHeading}
              onNavigate={navigate}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
