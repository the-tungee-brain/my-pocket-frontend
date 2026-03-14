"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { apiFetch } from "@/lib/apiClient";

export function SchwabConnectCard() {
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

  const showLoading = authorized === null;

  return (
    <div className="w-full overflow-hidden border-b border-neutral-800 bg-neutral-950/60">
      <div className="p-6 sm:p-8 bg-secondary">
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
            onClick={() => signOut()}
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
