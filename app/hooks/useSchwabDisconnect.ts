"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { track } from "@/lib/analytics";
import { apiFetch } from "@/lib/apiClient";

export function useSchwabDisconnect() {
  const { data: session } = useSession();
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const disconnect = useCallback(async () => {
    if (!session?.accessToken) {
      setDisconnectError("Sign in to disconnect your Schwab account.");
      return false;
    }

    setDisconnectError(null);
    setDisconnecting(true);
    track("schwab_disconnect_started");

    try {
      const res = await apiFetch("/auth/schwab/disconnect", {
        method: "DELETE",
        accessToken: session.accessToken,
      });

      if (!res.ok) {
        throw new Error("Could not disconnect Schwab.");
      }

      track("schwab_disconnect_completed");
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not disconnect Schwab. Please try again.";
      track("schwab_disconnect_failed", { error: message });
      setDisconnectError(message);
      return false;
    } finally {
      setDisconnecting(false);
    }
  }, [session?.accessToken]);

  const clearDisconnectError = useCallback(() => {
    setDisconnectError(null);
  }, []);

  return { disconnect, disconnecting, disconnectError, clearDisconnectError };
}
