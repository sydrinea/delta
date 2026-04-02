import { create } from "zustand";
import { persist } from "zustand/middleware";
import { version } from "../../../../package.json";
import { createHybridStorage } from "./shared";

interface AppState {
  lastSeenVersion: string;
  setLastSeenVersion: (nextVersion: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lastSeenVersion: version,
      setLastSeenVersion: (nextVersion) =>
        set(() => ({
          lastSeenVersion: nextVersion,
        })),
    }),
    {
      name: "delta-app-store",
      storage: createHybridStorage(),
      partialize: (state) => ({
        lastSeenVersion: state.lastSeenVersion,
      }),
    },
  ),
);
