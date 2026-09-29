"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ActivityEntry, Device, Share, SystemStatus, Website } from "@/lib/localdock/types";
import { Api } from "@/lib/localdock/client/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 2000,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/* ---------------- live data hooks (polled, real values) ---------------- */

export function useSystem() {
  return useQuery<SystemStatus>({
    queryKey: ["system"],
    queryFn: () => Api.system(),
    refetchInterval: 4000,
  });
}

export function useShares() {
  return useQuery<Share[]>({
    queryKey: ["shares"],
    queryFn: async () => (await Api.shares()).shares,
    refetchInterval: 8000,
  });
}

export function useDevices() {
  return useQuery<(Device & { online: boolean })[]>({
    queryKey: ["devices"],
    queryFn: async () => (await Api.devices()).devices,
    refetchInterval: 10000,
  });
}

export function useWebsites() {
  return useQuery<Website[]>({
    queryKey: ["websites"],
    queryFn: async () => (await Api.websites()).websites,
    refetchInterval: 10000,
  });
}

export function useActivity(limit = 40) {
  return useQuery<ActivityEntry[]>({
    queryKey: ["activity", limit],
    queryFn: async () => (await Api.activity(limit)).activity,
    refetchInterval: 8000,
  });
}

/** Shared polling invalidation helper. */
export function useRefresh() {
  return {
    refreshShares: () => queryClient.invalidateQueries({ queryKey: ["shares"] }),
    refreshSystem: () => queryClient.invalidateQueries({ queryKey: ["system"] }),
    refreshDevices: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
    refreshWebsites: () => queryClient.invalidateQueries({ queryKey: ["websites"] }),
    refreshActivity: () => queryClient.invalidateQueries({ queryKey: ["activity"] }),
  };
}
