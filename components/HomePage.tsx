"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";

export default function HomePage() {
  return (
    <main className="min-h-screen text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950/60 p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="space-y-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Connect your Schwab account
          </h1>
          <p className="text-sm text-neutral-400">
            Authorize with Schwab so this app can read your positions and
            balances securely. You can disconnect at any time.
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full sm:w-auto" onClick={() => {}}>
            Authorize with Schwab
          </Button>

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
