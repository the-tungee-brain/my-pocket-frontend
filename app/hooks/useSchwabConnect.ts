"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/apiClient";

export function useSchwabConnect() {
  const { data: session } = useSession();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!session?.accessToken) {
      setConnectError("Sign in to connect your Schwab account.");
      return;
    }

    setConnectError(null);
    setConnecting(true);

    try {
      const res = await apiFetch("/auth/schwab/connect", {
        method: "GET",
        accessToken: session.accessToken,
      });

      if (!res.ok) {
        throw new Error("Could not start Schwab connection.");
      }

      const data = (await res.json()) as { auth_url?: string };
      if (!data.auth_url) {
        throw new Error("Schwab connect URL was missing from the response.");
      }

      window.location.assign(data.auth_url);
    } catch (error) {
      setConnectError(
        error instanceof Error
          ? error.message
          : "Could not connect Schwab. Please try again.",
      );
      setConnecting(false);
    }
  }, [session?.accessToken]);

  const clearConnectError = useCallback(() => {
    setConnectError(null);
  }, []);

  return { connect, connecting, connectError, clearConnectError };
}
