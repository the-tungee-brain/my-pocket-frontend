"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchEmergingLeadersValidation } from "@/lib/apiClient";

export const emergingLeadersValidationQueryKey = [
  "emerging-leaders-validation",
] as const;

export function useEmergingLeadersValidation() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: [...emergingLeadersValidationQueryKey, accessToken],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Sign in to view Emerging Leaders validation.");
      }
      return fetchEmergingLeadersValidation(accessToken);
    },
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });
}
