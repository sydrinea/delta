export interface NavPage {
  id: string;
  label: string;
}

export interface NavSection {
  section: string;
  pages: NavPage[];
}

export const NAV: NavSection[] = [
  {
    section: "Getting Started",
    pages: [{ id: "quick-start", label: "Quick Start" }],
  },
  {
    section: "Builders",
    pages: [
      { id: "nfa", label: "NFA" },
      { id: "dfa", label: "DFA" },
      { id: "thompson", label: "Thompson Construction" },
      { id: "grammar", label: "Grammar" },
    ],
  },
  {
    section: "Local Usage",
    pages: [{ id: "api", label: "API Reference" }],
  },
];

export interface Heading {
  level: number;
  text: string;
  id: string;
}
