"use client";

import { Check, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  type ThemePreference,
  useThemePreference,
} from "@/app/hooks/useThemePreference";
import { AlertNotificationBell } from "@/components/momentum-breakout/AlertNotificationBell";
import { compactTextButtonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type HeaderActionsProps = {
  className?: string;
};

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function HeaderActions({ className }: HeaderActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { preference: themePreference, setPreference: setThemePreference } =
    useThemePreference();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
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
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={compactTextButtonClass}
        >
          <UserCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 min-w-48 border border-border bg-background py-1 text-sm shadow-lg"
          >
            <div className="border-b border-border/60 px-3 py-2">
              <fieldset className="space-y-0.5">
                <legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Theme
                </legend>
                {themeOptions.map((option) => {
                  const selected = option.value === themePreference;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => setThemePreference(option.value)}
                      className="flex w-full items-center justify-between gap-3 py-1.5 text-left text-sm text-foreground transition hover:text-muted"
                    >
                      <span>{option.label}</span>
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </fieldset>
            </div>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground transition hover:bg-muted-bg"
            >
              <Settings className="h-3.5 w-3.5 text-muted" aria-hidden />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground transition hover:bg-muted-bg"
            >
              <LogOut className="h-3.5 w-3.5 text-muted" aria-hidden />
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
