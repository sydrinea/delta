import { version } from "../../../package.json";

export const APP_VERSION = version;

export interface ReleaseNote {
  version: string;
  date: string;
  notes: string;
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: "0.1.6-beta.9",
    date: "March 23, 2026",
    notes: `## ✨ New Features & Improvements
- **State Management**: Swapped to a hybrid approach using both sessionStorage and localStorage for improved persistence.`,
  },
  {
    version: "0.1.5-beta.9",
    date: "March 23, 2026",
    notes: `## ✨ New Features & Improvements
- **Editor & Canvas**: Added a warning prompt when transitioning from the editor to the visual canvas to prevent accidental overwrites, and fixed lingering "ghost" states.
- **Canvas**: General improvements to canvas stability and functionality.
- **State Management**: Swapped to sessionStorage for improved local data handling.`,
  },
];
