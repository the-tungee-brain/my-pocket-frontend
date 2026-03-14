"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/Button";
import { apiFetch } from "@/lib/apiClient";
import { useEffect, useState } from "react";

export default function HomePage() {
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
    <main className="min-h-screen text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-secondary rounded-3xl border border-neutral-800 bg-neutral-950/60 p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="space-y-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {authorized
              ? "Schwab account connected"
              : "Connect your Schwab account"}
          </h1>
          <p className="text-sm text-neutral-400">
            {authorized
              ? "Your Schwab account is connected. We’ll keep your positions and balances in sync while your authorization is active."
              : "Authorize with Schwab so this app can read your positions and balances securely. You can disconnect at any time."}
          </p>
        </div>

        <div className="space-y-3">
          {authorized ? null : (
            <Button
              className="w-full sm:w-auto"
              onClick={handleAuthorizeSchwab}
              disabled={showLoading}
            >
              {showLoading
                ? "Checking Schwab status..."
                : "Authorize with Schwab"}
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

        <p className="mt-6 text-[11px] text-neutral-500">
          By continuing, you agree to the Schwab terms and understand that your
          data is used only to power this experience.
        </p>
      </div>
    </main>
  );
}
