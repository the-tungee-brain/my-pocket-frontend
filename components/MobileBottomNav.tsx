"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: BriefcaseBusiness,
    isActive: (pathname: string) => pathname.startsWith("/portfolio"),
  },
  {
    href: "/research",
    label: "Research",
    icon: Search,
    isActive: (pathname: string) => pathname.startsWith("/research"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    isActive: (pathname: string) => pathname.startsWith("/settings"),
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3">
        {items.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2.5 text-[11px] font-medium transition",
                active
                  ? "text-accent-strong"
                  : "text-muted hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
