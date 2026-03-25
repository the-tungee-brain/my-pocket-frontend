"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

type SchwabStatus = {
  authorized: boolean | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSchwabStatus(): SchwabStatus {
  const { data: session } = useSession();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!session?.accessToken) return;
    try {
      setError(null);
      const res = await apiFetch("/auth/schwab/status", {
        method: "GET",
        accessToken: session.accessToken,
      });
      if (!res.ok) throw new Error("Failed to fetch Schwab status");
      const data = (await res.json()) as { authorized: boolean };
      setAuthorized(data.authorized);
    } catch (e: any) {
      setAuthorized(false);
      setError(e?.message ?? "Error checking Schwab status");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [session?.accessToken]);

  return {
    authorized,
    loading: authorized === null,
    error,
    refetch: fetchStatus,
  };
}
