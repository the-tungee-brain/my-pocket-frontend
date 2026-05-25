"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings } from "lucide-react";
import { Button } from "./ui/Button";

export function HeaderActions() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href="/settings"
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-muted transition hover:bg-muted-bg hover:text-foreground"
      >
        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Settings</span>
      </Link>
      <Button
        size="xs"
        variant="ghost"
        className="text-[11px] text-muted hover:text-foreground"
        onClick={handleSignOut}
      >
        Log out
      </Button>
    </div>
  );
}
