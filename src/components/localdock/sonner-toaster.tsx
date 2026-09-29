"use client";

import { Toaster as Sonner } from "sonner";

/** Sonner toasts styled with the LocalDock palette. */
export function SonnerToaster() {
  return (
    <Sonner
      position="bottom-right"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-card !text-card-foreground !shadow-pop !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
