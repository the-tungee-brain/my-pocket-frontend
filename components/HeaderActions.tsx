"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings } from "lucide-react";

export function HeaderActions() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href="/settings"
        className="hidden h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-muted transition hover:bg-muted-bg hover:text-foreground md:inline-flex"
      >
        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        Settings
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex h-7 items-center rounded-md px-2 text-[11px] font-semibold text-muted transition hover:bg-muted-bg hover:text-foreground"
      >
        Log out
      </button>
    </div>
  );
}
