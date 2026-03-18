"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { apiFetch } from "@/lib/apiClient";

type Props = {
  compact?: boolean;
};

export function SchwabConnectCard({ compact = true }: Props) {
  const { data: session } = useSession();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    apiFetch("/auth/schwab/status", {
      method: "GET",
      accessToken: session.accessToken,
    })
      .then((res) => res.json() as Promise<{ authorized: boolean }>)
      .then((data) => setAuthorized(data.authorized))
      .catch(() => setAuthorized(false));
  }, [session?.accessToken]);

  const handleAuthorizeSchwab = async () => {
    const res = await apiFetch("/auth/schwab/connect", {
      method: "GET",
      accessToken: session?.accessToken,
    });
    if (!res.ok) return;
    const data = (await res.json()) as { auth_url: string };
    window.location.href = data.auth_url;
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const showLoading = authorized === null;

  if (compact) {
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Schwab
            </span>
            <span
              className={
                authorized
                  ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
                  : "inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400"
              }
            >
              {authorized ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="truncate text-[11px] text-neutral-400">
            {authorized
              ? "Syncing positions and balances."
              : showLoading
                ? "Checking Schwab status…"
                : "Connect to load your positions."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!authorized && (
            <Button
              size="xs"
              className="hidden sm:inline-flex"
              onClick={handleAuthorizeSchwab}
              disabled={showLoading}
            >
              {showLoading ? "Checking…" : "Connect"}
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            className="text-[11px] text-neutral-400 hover:text-neutral-100"
            onClick={handleSignOut}
          >
            Log out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden mx-auto max-w-3xl">
      <div className="py-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {authorized
              ? "Your Schwab account is connected"
              : "Connect your Schwab account"}
          </h1>
          <p className="text-sm text-neutral-400">
            {authorized
              ? "We’ll keep your positions and balances in sync while your authorization is active."
              : "Authorize with Schwab so this app can read your positions and balances securely. You can disconnect at any time."}
          </p>
        </div>

        <div className="space-y-4">
          {!authorized && (
            <Button
              className="w-full sm:w-auto"
              onClick={handleAuthorizeSchwab}
              disabled={showLoading}
            >
              {showLoading
                ? "Checking Schwab status..."
                : "Connect Schwab account"}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleSignOut}
          >
            Log out
          </Button>
        </div>

        {!authorized && (
          <p className="mt-6 text-[11px] text-neutral-500">
            By continuing, you agree to the Schwab terms and understand that
            your data is used only to power this experience.
          </p>
        )}
      </div>
    </div>
  );
}
