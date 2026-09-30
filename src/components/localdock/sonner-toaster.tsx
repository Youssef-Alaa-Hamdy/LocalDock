"use client";

import { Toaster as Sonner } from "sonner";
import { useI18n } from "@/lib/localdock/i18n/provider";

/** Sonner toasts styled with the LocalDock palette (RTL-aware). */
export function SonnerToaster() {
  const { dir } = useI18n();
  return (
    <Sonner
      dir={dir}
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
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
