"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchEmergingLeaders } from "@/lib/apiClient";

export const emergingLeadersQueryKey = ["emerging-leaders"] as const;

export function useEmergingLeaders(limit = 20) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: [...emergingLeadersQueryKey, accessToken, limit],
    queryFn: () => {
      if (!accessToken) throw new Error("Sign in to view emerging leaders.");
      return fetchEmergingLeaders(accessToken, limit);
    },
    enabled: !!accessToken,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
