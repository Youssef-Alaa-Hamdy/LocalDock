"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "shares"
  | "files"
  | "transfers"
  | "devices"
  | "websites"
  | "settings";

interface FilesTarget {
  shareId: string;
  path: string;
  nonce?: number;
}

interface NavState {
  view: ViewKey;
  filesTarget: FilesTarget | null;
  go: (view: ViewKey) => void;
  openFiles: (shareId: string, path?: string) => void;
}

export const useNav = create<NavState>((set) => ({
  view: "dashboard",
  filesTarget: null,
  go: (view) => set({ view }),
  openFiles: (shareId, path = "") =>
    set((s) => ({
      view: "files",
      filesTarget: { shareId, path, nonce: (s.filesTarget?.nonce ?? 0) + 1 },
    })),
}));
