"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings } from "lucide-react";
import { compactTextButtonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function HeaderActions() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href="/settings"
        className={cn(compactTextButtonClass, "hidden md:inline-flex")}
      >
        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        Settings
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className={compactTextButtonClass}
      >
        Log out
      </button>
    </div>
  );
}
