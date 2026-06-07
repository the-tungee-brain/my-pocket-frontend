"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AlertNotificationBell } from "@/components/momentum-breakout/AlertNotificationBell";
import { compactTextButtonClass } from "@/components/ui/Button";
import { iconButtonClass } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

type HeaderActionsProps = {
  className?: string;
};

export function HeaderActions({ className }: HeaderActionsProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-2",
        className,
      )}
    >
      <AlertNotificationBell />
      <Link
        href="/settings"
        aria-label="Settings"
        className={cn(iconButtonClass, "h-8 w-8 md:hidden")}
      >
        <Settings className="h-4 w-4" aria-hidden="true" />
      </Link>
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
