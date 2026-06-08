"use client";

import { BriefcaseBusiness, Search, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    href: "/top-movers",
    label: "Movers",
    icon: TrendingUp,
    isActive: (pathname: string) =>
      pathname.startsWith("/top-movers") ||
      pathname.startsWith("/emerging-leaders") ||
      pathname.startsWith("/momentum-breakout"),
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
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2.5 text-[11px] font-medium transition",
                active ? "text-foreground" : "text-muted hover:text-foreground",
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
